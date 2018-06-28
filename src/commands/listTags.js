import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'

/**
 * List tags
 *
 * @link https://isomorphic-git.github.io/docs/listTags.html
 */
export async function listTags ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  try {
    const fs = new FileSystem(_fs)
    return GitRefManager.listTags({ fs, gitdir })
  } catch (err) {
    err.caller = 'git.listTags'
    throw err
  }
}
