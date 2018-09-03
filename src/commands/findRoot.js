import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { cores } from '../utils/plugins.js'

/**
 * Find the root git directory
 *
 * @link https://isomorphic-git.github.io/docs/findRoot.html
 */
export async function findRoot ({
  core = 'default',
  fs: _fs = cores.get(core).get('fs'),
  filepath
}) {
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
