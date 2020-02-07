// @ts-check
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} args.ancestor
 * @param {number} args.depth - Maximum depth to search before giving up. -1 means no maximum depth.
 *
 * @returns {Promise<boolean>}
 */
export async function isDescendent ({ fs, gitdir, oid, ancestor, depth }) {
  const shallows = await GitShallowManager.read({ fs, gitdir })
  if (!oid) {
    throw new GitError(E.MissingRequiredParameterError, {
      function: 'isDescendent',
      parameter: 'oid'
    })
  }
  if (!ancestor) {
    throw new GitError(E.MissingRequiredParameterError, {
      function: 'isDescendent',
      parameter: 'ancestor'
    })
  }
  // If you don't like this behavior, add your own check.
  // Edge cases are hard to define a perfect solution.
  if (oid === ancestor) return false
  // We do not use recursion here, because that would lead to depth-first traversal,
  // and we want to maintain a breadth-first traversal to avoid hitting shallow clone depth cutoffs.
  const queue = [oid]
  const visited = new Set()
  let searchdepth = 0
  while (queue.length) {
    if (searchdepth++ === depth) {
      throw new GitError(E.MaxSearchDepthExceeded, { depth })
    }
    const oid = queue.shift()
    const { type, object } = await readObject({
      fs,
      gitdir,
      oid
    })
    if (type !== 'commit') {
      throw new GitError(E.ResolveCommitError, { oid })
    }
    const commit = GitCommit.from(object).parse()
    // Are any of the parents the sought-after ancestor?
    for (const parent of commit.parent) {
      if (parent === ancestor) return true
    }
    // If not, add them to heads (unless we know this is a shallow commit)
    if (!shallows.has(oid)) {
      for (const parent of commit.parent) {
        if (!visited.has(parent)) {
          queue.push(parent)
          visited.add(parent)
        }
      }
    }
    // Eventually, we'll travel entire tree to the roots where all the parents are empty arrays,
    // or hit the shallow depth and throw an error. Excluding the possibility of grafts, or
    // different branches cloned to different depths, you would hit this error at the same time
    // for all parents, so trying to continue is futile.
  }
  return false
}
