import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Check whether a git commit is descended from another
 *
 * @link https://isomorphic-git.github.io/docs/isDescendent.html
 */
export async function isDescendent ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oid,
  ancestor,
  depth = -1
}) {
  try {
    const fs = new FileSystem(_fs)
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
    let visited = new Set()
    let searchdepth = 0
    while (queue.length) {
      if (searchdepth++ === depth) {
        throw new GitError(E.MaxSearchDepthExceeded, { depth })
      }
      let oid = queue.shift()
      let { type, object } = await readObject({
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
      // If not, add them to heads
      for (const parent of commit.parent) {
        if (!visited.has(parent)) {
          queue.push(parent)
          visited.add(parent)
        }
      }
      // Eventually, we'll travel entire tree to the roots where all the parents are empty arrays,
      // or hit the shallow depth and throw an error. Excluding the possibility of grafts, or
      // different branches cloned to different depths, you would hit this error at the same time
      // for all parents, so trying to continue is futile.
    }
    return false
  } catch (err) {
    err.caller = 'git.isDescendent'
    throw err
  }
}
