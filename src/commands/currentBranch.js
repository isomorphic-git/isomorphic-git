import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'
import { abbreviateRef } from '../utils'

/**
 * Get the name of the branch currently pointed to by .git/HEAD
 *
 * @link https://isomorphic-git.github.io/docs/currentBranch.html
 */
export async function currentBranch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  fullname = false
}) {
  try {
    const fs = new FileSystem(_fs)
    let ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    if (fullname) return ref
    return abbreviateRef(ref)
  } catch (err) {
    err.caller = 'git.currentBranch'
    throw err
  }
}
