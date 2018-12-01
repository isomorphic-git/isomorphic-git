import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * List tags
 *
 * @link https://isomorphic-git.github.io/docs/listTags.html
 */
export async function listTags ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs')
}) {
  try {
    const fs = new FileSystem(_fs)
    return GitRefManager.listTags({ fs, gitdir })
  } catch (err) {
    err.caller = 'git.listTags'
    throw err
  }
}
