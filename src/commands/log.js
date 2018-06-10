import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'
import { compareAge } from '../utils/compareAge'
import { logCommit } from '../utils/logCommit'

/**
 * Get commit descriptions from the git history
 *
 * @link https://isomorphic-git.github.io/docs/log.html
 */
export async function log ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref = 'HEAD',
  depth,
  since, // Date
  signing = false
}) {
  try {
    const fs = new FileSystem(_fs)
    let sinceTimestamp =
      since === undefined ? undefined : Math.floor(since.valueOf() / 1000)
    // TODO: In the future, we may want to have an API where we return a
    // async iterator that emits commits.
    let commits = []
    let oid = await GitRefManager.resolve({ fs, gitdir, ref })
    let tips /*: Array */ = [await logCommit({ fs, gitdir, oid, signing })]

    while (true) {
      let commit = tips.pop()

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

      // Add the parents of this commit to the queue
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of commit.parent) {
        let commit = await logCommit({ fs, gitdir, oid, signing })
        if (!tips.map(commit => commit.oid).includes(commit.oid)) {
          tips.push(commit)
        }
      }

      // Stop the loop if there are no more commit parents
      if (tips.length === 0) break

      // Process tips in order by age
      tips.sort(compareAge)
    }
    return commits
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
