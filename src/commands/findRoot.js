import path from 'path'

import { FileSystem } from '../models'

/**
 * Find the root git directory
 *
 * @link https://isomorphic-git.github.io/docs/findRoot.html
 */
export async function findRoot ({ fs: _fs, filepath }) {
  const fs = new FileSystem(_fs)
  return _findRoot(fs, filepath)
}

async function _findRoot (fs, filepath) {
  if (await fs.exists(path.join(filepath, '.git'))) {
    return filepath
  } else {
    let parent = path.dirname(filepath)
    if (parent === filepath) throw new Error('Unable to find git root')
    return _findRoot(fs, parent)
  }
}
