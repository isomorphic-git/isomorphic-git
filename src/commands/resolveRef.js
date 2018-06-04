import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

/**
 * Get the value of a symbolic ref or resolve a ref to its object id
 *
 * @link https://isomorphic-git.github.io/docs/resolveRef.html
 */
export async function resolveRef ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  depth
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref,
      depth
    })
    return oid
  } catch (err) {
    err.caller = 'git.resolveRef'
    throw err
  }
}
