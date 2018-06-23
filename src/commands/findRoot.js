import path from 'path'

import { E, FileSystem, GitError } from '../models'

/**
 * Find the root git directory
 *
 * @link https://isomorphic-git.github.io/docs/findRoot.html
 */
export async function findRoot ({ fs: _fs, filepath }) {
  try {
    const fs = new FileSystem(_fs)
    return _findRoot(fs, filepath)
  } catch (err) {
    err.caller = 'git.findRoot'
    throw err
  }
}

async function _findRoot (fs, filepath) {
  if (await fs.exists(path.join(filepath, '.git'))) {
    return filepath
  } else {
    let parent = path.dirname(filepath)
    if (parent === filepath) {
      throw new GitError(E.GitRootNotFoundError, { filepath })
    }
    return _findRoot(fs, parent)
  }
}
