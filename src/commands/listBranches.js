import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List branches
 *
 * @link https://isomorphic-git.github.io/docs/listBranches.html
 */
export async function listBranches ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  remote = undefined
}) {
  try {
    const fs = new FileSystem(_fs)
    return GitRefManager.listBranches({ fs, gitdir, remote })
  } catch (err) {
    err.caller = 'git.listBranches'
    throw err
  }
}
