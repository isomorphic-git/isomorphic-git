import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * Get the value of a symbolic ref or resolve a ref to its object id
 *
 * @link https://isomorphic-git.github.io/docs/resolveRef.html
 */
export async function resolveRef ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
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
