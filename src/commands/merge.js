// @ts-check
// import diff3 from 'node-diff3'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { abbreviateRef } from '../utils/abbreviateRef.js'
import { join } from '../utils/join.js'
import { mergeTree } from '../utils/mergeTree.js'
import { cores } from '../utils/plugins.js'

import { commit } from './commit'
import { currentBranch } from './currentBranch.js'
import { findMergeBase } from './findMergeBase.js'

/**
 *
 * @typedef {Object} MergeResult - Returns an object with a schema like this:
 * @property {string} [oid] - The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
 * @property {boolean} [alreadyMerged] - True if the branch was already merged so no changes were made
 * @property {boolean} [fastForward] - True if it was a fast-forward merge
 * @property {boolean} [mergeCommit] - True if merge resulted in a merge commit
 * @property {string} [tree] - The SHA-1 object id of the tree resulting from a merge commit
 *
 */

/**
 * Merge two branches
 *
 * ## Limitations
 *
 * Currently it does not support incomplete merges. That is, if there are merge conflicts it cannot solve
 * with the built in diff3 algorithm it will not modify the working dir, and will throw a [`MergeNotSupportedFail`](./errors.md#mergenotsupportedfail) error.
 *
 * Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)
 *
 * Currently it does not support selecting alternative merge strategies.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ours] - The branch receiving the merge. If undefined, defaults to the current branch.
 * @param {string} args.theirs - The branch to be merged
 * @param {boolean} [args.fastForwardOnly = false] - If true, then non-fast-forward merges will throw an Error instead of performing a merge.
 * @param {boolean} [args.dryRun = false] - If true, simulates a merge so you can test whether it would succeed.
 * @param {boolean} [args.noUpdateBranch = false] - If true, does not update the branch pointer after creating the commit.
 * @param {string} [args.message] - Overrides the default auto-generated merge commit message
 * @param {Object} [args.author] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {string} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {string} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {string} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {string} [args.committer.date] - Set the committer timestamp field. Default is the current date.
 * @param {string} [args.committer.timestamp] - Set the committer timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {string} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 *
 * @returns {Promise<MergeResult>} Resolves to a description of the merge operation
 * @see MergeResult
 *
 * @example
 * let m = await git.merge({ dir: '$input((/))', ours: '$input((master))', theirs: '$input((remotes/origin/master))' })
 * console.log(m)
 *
 */
export async function merge ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  ours,
  theirs,
  fastForwardOnly = false,
  dryRun = false,
  noUpdateBranch = false,
  message,
  author,
  committer,
  signingKey
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
    if (ours === undefined) {
      ours = await currentBranch({ core, gitdir, fullname: true })
    }
    ours = await GitRefManager.expand({
      fs,
      gitdir,
      ref: ours
    })
    theirs = await GitRefManager.expand({
      fs,
      gitdir,
      ref: theirs
    })
    const ourOid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: ours
    })
    const theirOid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: theirs
    })
    // find most recent common ancestor of ref a and ref b
    const baseOids = await findMergeBase({
      core,
      dir,
      gitdir,
      oids: [ourOid, theirOid]
    })
    if (baseOids.length !== 1) {
      throw new GitError(E.MergeNotSupportedFail)
    }
    const baseOid = baseOids[0]
    // handle fast-forward case
    if (baseOid === theirOid) {
      return {
        oid: ourOid,
        alreadyMerged: true
      }
    }
    if (baseOid === ourOid) {
      if (!dryRun && !noUpdateBranch) {
        await GitRefManager.writeRef({ fs, gitdir, ref: ours, value: theirOid })
      }
      return {
        oid: theirOid,
        fastForward: true
      }
    } else {
      // not a simple fast-forward
      if (fastForwardOnly) {
        throw new GitError(E.FastForwardFail)
      }
      // try a fancier merge
      const tree = await mergeTree({
        core,
        gitdir,
        ourOid,
        theirOid,
        baseOid,
        ourName: ours,
        baseName: 'base',
        theirName: theirs,
        dryRun
      })
      if (!message) {
        message = `Merge branch '${abbreviateRef(theirs)}' into ${abbreviateRef(
          ours
        )}`
      }
      const oid = await commit({
        core,
        gitdir,
        message,
        ref: ours,
        tree,
        parent: [ourOid, theirOid],
        author,
        committer,
        signingKey,
        dryRun,
        noUpdateBranch
      })
      return {
        oid,
        tree,
        mergeCommit: true
      }
    }
  } catch (err) {
    err.caller = 'git.merge'
    throw err
  }
}
