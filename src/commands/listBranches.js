import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * List branches
 *
 * @link https://isomorphic-git.github.io/docs/listBranches.html
 */
export async function listBranches ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
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
