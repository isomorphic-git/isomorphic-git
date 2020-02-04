// @ts-check
import '../commands/typedefs.js'

import { readCommit } from '../commands/readCommit.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { compareAge } from '../utils/compareAge.js'
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
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
 * console.log(commits)
 *
 */
export async function log ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'HEAD',
  depth = undefined,
  since = undefined // Date
}) {
  try {
    const fs = new FileSystem(_fs)
    const sinceTimestamp =
      since === undefined ? undefined : Math.floor(since.valueOf() / 1000)
    // TODO: In the future, we may want to have an API where we return a
    // async iterator that emits commits.
    const commits = []
    const shallowCommits = await GitShallowManager.read({ fs, gitdir })
    const oid = await GitRefManager.resolve({ fs, gitdir, ref })
    const tips = [await readCommit({ fs: _fs, gitdir, oid })]

    while (true) {
      const commit = tips.pop()

      // Stop the log if we've hit the age limit
      if (
        sinceTimestamp !== undefined &&
        commit.commit.committer.timestamp <= sinceTimestamp
      ) {
        break
      }

      commits.push(commit)

      // Stop the loop if we have enough commits now.
      if (depth !== undefined && commits.length === depth) break

      // If this is not a shallow commit...
      if (!shallowCommits.has(commit.oid)) {
        // Add the parents of this commit to the queue
        // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
        for (const oid of commit.commit.parent) {
          const commit = await readCommit({ fs: _fs, gitdir, oid })
          if (!tips.map(commit => commit.oid).includes(commit.oid)) {
            tips.push(commit)
          }
        }
      }

      // Stop the loop if there are no more commit parents
      if (tips.length === 0) break

      // Process tips in order by age
      tips.sort((a, b) => compareAge(a.commit, b.commit))
    }
    return commits
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
