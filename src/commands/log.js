// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { compareAge } from '../utils/compareAge.js'
import { join } from '../utils/join.js'
import { logCommit } from '../utils/logCommit.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} CommitDescription - Returns an array of objects with a schema like this:
 * @property {string} oid - SHA-1 object id of this commit
 * @property {string} message - Commit message
 * @property {string} tree - SHA-1 object id of corresponding file tree
 * @property {string[]} parent - an array of zero or more SHA-1 object ids
 * @property {Object} author
 * @property {string} author.name - The author's name
 * @property {string} author.email - The author's email
 * @property {number} author.timestamp - UTC Unix timestamp in seconds
 * @property {number} author.timezoneOffset - Timezone difference from UTC in minutes
 * @property {Object} committer
 * @property {string} committer.name - The committer's name
 * @property {string} committer.email - The committer's email
 * @property {number} committer.timestamp - UTC Unix timestamp in seconds
 * @property {number} committer.timezoneOffset - Timezone difference from UTC in minutes
 * @property {string} [gpgsig] - PGP signature (if present)
 * @property {string} [payload] - PGP signing payload (if requested)
 */

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - The commit to begin walking backwards through the history from
 * @param {number} [args.depth] - Limit the number of commits returned. No limit by default.
 * @param {Date} [args.since] - Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
 * @param {boolean} [args.signing = false] - Include the PGP signing payload
 *
 * @returns {Promise<Array<CommitDescription>>} Resolves to an array of CommitDescription objects
 * @see CommitDescription
 *
 * @example
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
 * console.log(commits)
 *
 */
export async function log ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'HEAD',
  depth = undefined,
  since = undefined, // Date
  signing = false
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
    const tips /*: Array */ = [await logCommit({ fs, gitdir, oid, signing })]

    while (true) {
      const commit = tips.pop()

      // Stop the loop if we encounter an error
      if (commit.error) {
        commits.push(commit)
        break
      }

      // Stop the log if we've hit the age limit
      if (
        sinceTimestamp !== undefined &&
        commit.committer.timestamp <= sinceTimestamp
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
        for (const oid of commit.parent) {
          const commit = await logCommit({ fs, gitdir, oid, signing })
          if (!tips.map(commit => commit.oid).includes(commit.oid)) {
            tips.push(commit)
          }
        }
      }

      // Stop the loop if there are no more commit parents
      if (tips.length === 0) break

      // Process tips in order by age
      tips.sort(compareAge)
    }
    // @ts-ignore
    return commits
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
