// @ts-check
import '../typedefs.js'

import { _readCommit } from '../commands/readCommit.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { compareAge } from '../utils/compareAge.js'
import { resolveFileIdInTree } from '../utils/resolveFileIdInTree.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string=} args.filepath optional get the commit for the filepath only
 * @param {string} args.ref
 * @param {number|void} args.depth
 * @param {Date|void} args.since
 * @param {boolean=} args.force do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} args.follow Continue listing the history of a file beyond renames (works only for a single file). defaults to false
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
export async function _log({
  fs,
  gitdir,
  filepath,
  ref,
  depth,
  since,
  force,
  follow,
}) {
  const sinceTimestamp =
    typeof since === 'undefined'
      ? undefined
      : Math.floor(since.valueOf() / 1000)
  // TODO: In the future, we may want to have an API where we return a
  // async iterator that emits commits.
  const commits = []
  const shallowCommits = await GitShallowManager.read({ fs, gitdir })
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  const tips = [await _readCommit({ fs, gitdir, oid })]
  let lastFileOid
  let lastCommit

  while (true) {
    const commit = tips.pop()

    // Stop the log if we've hit the age limit
    if (
      sinceTimestamp !== undefined &&
      commit.commit.committer.timestamp <= sinceTimestamp
    ) {
      break
    }

    if (filepath) {
      let vFileOid
      try {
        vFileOid = await resolveFilepath({
          fs,
          gitdir,
          oid: commit.commit.tree,
          filepath,
        })
        if (lastCommit && lastFileOid !== vFileOid) {
          commits.push(lastCommit)
        }
        lastFileOid = vFileOid
        lastCommit = commit
      } catch (e) {
        if (e instanceof NotFoundError) {
          let found = follow && lastFileOid
          if (found) {
            found = await resolveFileIdInTree({
              fs,
              gitdir,
              oid: commit.commit.tree,
              fileId: lastFileOid,
            })
            if (found) {
              filepath = found
              if (lastCommit) commits.push(lastCommit)
            }
          }
          if (!found) {
            if (!force && !follow) throw e
            if (lastFileOid) {
              commits.push(lastCommit)
              break
            }
          }
          lastCommit = commit
        } else throw e
      }
    } else {
      commits.push(commit)
    }

    // Stop the loop if we have enough commits now.
    if (depth !== undefined && commits.length === depth) {
      endCommit(commit)
      break
    }

    // If this is not a shallow commit...
    if (!shallowCommits.has(commit.oid)) {
      // Add the parents of this commit to the queue
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of commit.commit.parent) {
        const commit = await _readCommit({ fs, gitdir, oid })
        if (!tips.map(commit => commit.oid).includes(commit.oid)) {
          tips.push(commit)
        }
      }
    }

    // Stop the loop if there are no more commit parents
    if (tips.length === 0) {
      endCommit(commit)
      break
    }

    // Process tips in order by age
    tips.sort((a, b) => compareAge(a.commit, b.commit))
  }
  return commits

  function endCommit(commit) {
    if (filepath) commits.push(commit)
  }
}
