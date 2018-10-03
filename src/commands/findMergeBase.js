import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * Find the merge base for a set of commits
 *
 * @link https://isomorphic-git.github.io/docs/findMergeBase.html
 */
export async function findMergeBase ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oids
}) {
  try {
    const fs = new FileSystem(_fs)
    // Dummy function
    return fs && []
  } catch (err) {
    err.caller = 'git.findMergeBase'
    throw err
  }
}
