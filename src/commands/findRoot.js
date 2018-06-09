import path from 'path'

import { FileSystem } from '../models'

/**
 * Find the root git directory
 *
 * @link https://isomorphic-git.github.io/docs/findRoot.html
 */
export async function findRoot ({ fs: _fs, filepath }) {
  try {
    const fs = new FileSystem(_fs)
    if (await fs.exists(path.join(filepath, '.git'))) {
      return filepath
    } else {
      let parent = path.dirname(filepath)
      if (parent === filepath) throw new Error('Unable to find git root')
      return findRoot({ fs, filepath: parent })
    }
  } catch (err) {
    err.caller = 'git.findRoot'
    throw err
  }
}
