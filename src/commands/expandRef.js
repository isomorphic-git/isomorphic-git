import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * Expand an abbreviated ref to its full name
 *
 * @link https://isomorphic-git.github.io/docs/expandRef.html
 */
export async function expandRef ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    const fullref = await GitRefManager.expand({
      fs,
      gitdir,
      ref
    })
    return fullref
  } catch (err) {
    err.caller = 'git.expandRef'
    throw err
  }
}
