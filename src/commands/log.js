import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { compareAge } from '../utils/compareAge.js'
import { logCommit } from '../utils/logCommit.js'
import { cores } from '../utils/plugins.js'

/**
 * Get commit descriptions from the git history
 *
 * @link https://isomorphic-git.github.io/docs/log.html
 */
export async function log ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
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
    let shallowCommits = await GitShallowManager.read({ fs, gitdir })
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

      // If this is not a shallow commit...
      if (!shallowCommits.has(commit.oid)) {
        // Add the parents of this commit to the queue
        // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
        for (const oid of commit.parent) {
          let commit = await logCommit({ fs, gitdir, oid, signing })
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
    return commits
  } catch (err) {
    err.caller = 'git.log'
    throw err
  }
}
