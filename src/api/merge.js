// @ts-check
import '../typedefs.js'

import { _merge } from '../commands/merge.js'
import { MissingNameError } from '../errors/MissingNameError.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'

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
 * with the built in diff3 algorithm it will not modify the working dir, and will throw a [`MergeNotSupportedError`](./errors.md#mergenotsupportedError) error.
 *
 * Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)
 *
 * Currently it does not support selecting alternative merge strategies.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
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
 * @param {number} [args.author.timestamp=Math.floor(Date.now()/1000)] - Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer] - passed to [commit](commit.md) when creating a merge commit
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - passed to [commit](commit.md) when creating a merge commit
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<MergeResult>} Resolves to a description of the merge operation
 * @see MergeResult
 *
 * @example
 * let m = await git.merge({
 *   fs,
 *   dir: '/tutorial',
 *   ours: 'main',
 *   theirs: 'remotes/origin/main'
 * })
 * console.log(m)
 *
 */
export async function merge({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  ours,
  theirs,
  fastForwardOnly = false,
  dryRun = false,
  noUpdateBranch = false,
  message,
  author: _author,
  committer: _committer,
  signingKey,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    if (signingKey) {
      assertParameter('onSign', onSign)
    }
    const fs = new FileSystem(_fs)

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author })
    if (!author && !fastForwardOnly) throw new MissingNameError('author')

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer,
    })
    if (!committer && !fastForwardOnly) {
      throw new MissingNameError('committer')
    }

    return await _merge({
      fs,
      cache,
      gitdir,
      ours,
      theirs,
      fastForwardOnly,
      dryRun,
      noUpdateBranch,
      message,
      author,
      committer,
      signingKey,
      onSign,
    })
  } catch (err) {
    err.caller = 'git.merge'
    throw err
  }
}
