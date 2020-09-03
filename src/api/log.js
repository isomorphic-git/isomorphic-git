// @ts-check
import '../typedefs.js'

import { _log } from '../commands/log.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - The commit to begin walking backwards through the history from
 * @param {number} [args.depth] - Limit the number of commits returned. No limit by default.
 * @param {Date} [args.since] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
 *
 * @returns {Promise<Array<ReadCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({
 *   fs,
 *   dir: '/tutorial',
 *   depth: 5,
 *   ref: 'main'
 * })
 * console.log(commits)
 *
 */
export async function log({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'HEAD',
  depth,
  since, // Date
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)

    return await _log({
      fs: new FileSystem(fs),
      cache: {},
      gitdir,
      ref,
      depth,
      since,
    })
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
