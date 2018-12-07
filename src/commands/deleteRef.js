import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Delete a ref.
 *
 * @link https://isomorphic-git.github.io/docs/deleteRef.html
 */
export async function deleteRef ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    await GitRefManager.deleteRef({ fs, gitdir, ref })
  } catch (err) {
    err.caller = 'git.deleteRef'
    throw err
  }
}
