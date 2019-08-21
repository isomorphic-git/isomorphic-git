// @ts-check
// import diff3 from 'node-diff3'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { abbreviateRef } from '../utils/abbreviateRef.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { currentBranch } from './currentBranch.js'
import { commit } from './commit'
import { diffTree } from './diffTree.js'
import { mergeTreePatches } from './mergeTreePatches.js'
import { applyTreePatch } from './applyTreePatch.js'
import { findMergeBase } from './findMergeBase.js'

/**
 *
 * @typedef {Object} MergeReport - Returns an object with a schema like this:
 * @property {string} [oid] - The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
 * @property {boolean} [alreadyMerged] - True if the branch was already merged so no changes were made
 * @property {boolean} [fastForward] - True if it was a fast-forward merge
 * @property {boolean} [mergeCommit] - True if merge resulted in a merge commit
 * @property {string} [tree] - The SHA-1 object id of the tree resulting from a merge commit
 *
 */

/**
 * Merge one or more branches *(Currently, only fast-forward merges are implemented.)*
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ours] - The branch receiving the merge. If undefined, defaults to the current branch.
 * @param {string} args.theirs - The branch to be merged
 * @param {boolean} [args.fastForwardOnly = false] - If true, then non-fast-forward merges will throw an Error instead of performing a merge.
 * @param {boolean} [args.dryRun = false] - If true, simulates a merge so you can test whether it would succeed.
 * @param {Object} [args.author] - passed to [commit](commit.md) when creating a merge commit
 * @param {Object} [args.committer] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 *
 * @returns {Promise<MergeReport>} Resolves to a description of the merge operation
 * @see MergeReport
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
  fs: _fs = cores.get(core).get('fs'),
  ours,
  theirs,
  fastForwardOnly = false,
  dryRun = false,
  author,
  committer,
  signingKey
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ours === undefined) {
      ours = await currentBranch({ fs, gitdir, fullname: true })
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
      fs,
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
      if (!dryRun) {
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
      const treeOid = await basicMerge({ fs, gitdir, ours: ourOid, theirs: theirOid, base: baseOid })
      if (!dryRun) {
        const oid = await commit({
          fs,
          gitdir,
          message: `Merge branch '${abbreviateRef(theirs)}' into ${abbreviateRef(ours)}`,
          ref: ours,
          parent: [ourOid, theirOid],
          author,
          committer,
          signingKey
        })
        return {
          oid,
          tree: treeOid,
          mergeCommit: true
        }
      }
      return {
        tree: treeOid,
        mergeCommit: true
      }
    }
  } catch (err) {
    err.caller = 'git.merge'
    throw err
  }
}

async function basicMerge ({ fs, gitdir, ours, theirs, base }) {
  const diff1 = await diffTree({ gitdir, before: base, after: ours })
  const diff2 = await diffTree({ gitdir, before: base, after: theirs })
  const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
  if (hasConflicts) throw new GitError(E.MergeNotSupportedFail)
  return applyTreePatch({
    fs,
    gitdir,
    base,
    treePatch
  })
}
