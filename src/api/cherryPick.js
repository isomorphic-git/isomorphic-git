// @ts-check
import '../typedefs.js'

import { _cherryPick } from '../commands/cherryPick.js'
import { _readCommit } from '../commands/readCommit.js'
import { MissingNameError } from '../errors/MissingNameError.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'

/**
 * Cherry-pick a commit onto the current branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The commit to cherry-pick
 * @param {object} [args.cache] - a [cache](cache.md) object
 * @param {object} [args.committer] - The details about the commit committer. If not specified, uses user.name and user.email config with current timestamp.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {boolean} [args.dryRun=false] - If true, simulates cherry-picking so you can test whether it would succeed. Implies `noUpdateBranch`.
 * @param {boolean} [args.noUpdateBranch=false] - If true, does not update the branch pointer after creating the commit.
 * @param {boolean} [args.abortOnConflict=true] - If true, merges with conflicts will throw a `MergeConflictError`. If false, merge conflicts will leave conflict markers in the working directory and index.
 * @param {MergeDriverCallback} [args.mergeDriver] - A custom merge driver for handling conflicts.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit
 *
 * @example
 * let oid = await git.cherryPick({
 *   fs,
 *   dir: '/tutorial',
 *   oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
 * })
 * console.log(oid)
 *
 */
export async function cherryPick({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  cache = {},
  committer,
  dryRun = false,
  noUpdateBranch = false,
  abortOnConflict = true,
  mergeDriver,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oid', oid)

    const fs = new FileSystem(_fs)
    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })

    // Read the commit to be cherry-picked
    const { commit: cherryCommit } = await _readCommit({
      fs,
      cache,
      gitdir: updatedGitdir,
      oid,
    })

    // If the target is a merge commit, let the command layer handle rejecting it
    // (so tests expecting a CherryPickMergeCommitError still work). Only enforce
    // a committer when we are actually going to create a commit.
    if (cherryCommit.parent && cherryCommit.parent.length > 1) {
      return await _cherryPick({
        fs,
        cache,
        dir,
        gitdir: updatedGitdir,
        oid,
        dryRun,
        noUpdateBranch,
        abortOnConflict,
        committer: undefined,
        mergeDriver,
      })
    }

    // Use provided committer, not the original commit's committer
    const normalizedCommitter = await normalizeCommitterObject({
      fs,
      gitdir: updatedGitdir,
      committer,
    })
    if (!normalizedCommitter) {
      throw new MissingNameError('committer')
    }

    return await _cherryPick({
      fs,
      cache,
      dir,
      gitdir: updatedGitdir,
      oid,
      dryRun,
      noUpdateBranch,
      abortOnConflict,
      committer: normalizedCommitter,
      mergeDriver,
    })
  } catch (err) {
    err.caller = 'git.cherryPick'
    throw err
  }
}
