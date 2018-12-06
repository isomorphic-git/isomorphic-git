import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitError, E } from '../models/GitError.js'

/**
 * Update refs.
 *
 * @link https://isomorphic-git.github.io/docs/writeRef.html
 */
export async function writeRef ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  value,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (!force) {
      const refs = await GitRefManager.listRefs({ fs, gitdir, ref })
      if (refs.length !== 0) {
        throw new GitError(E.RefExistsError, { noun: 'ref', ref })
      }
    }

    await GitRefManager.writeRef({
      fs,
      gitdir,
      ref,
      value
    })
  } catch (err) {
    err.caller = 'git.writeRef'
    throw err
  }
}
