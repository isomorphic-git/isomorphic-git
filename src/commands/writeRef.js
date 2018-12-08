import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitError, E } from '../models/GitError.js'

/**
 * Write a ref.
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
  force = false,
  symbolic = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (!force) {
      const exist = await fs.exists(`${gitdir}/${ref}`)
      if (exist) {
        throw new GitError(E.RefExistsError, { noun: 'ref', ref })
      }
    }

    if (symbolic) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref,
        value
      })
    } else {
      value = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: value
      })
      await GitRefManager.writeRef({
        fs,
        gitdir,
        ref,
        value
      })
    }
  } catch (err) {
    err.caller = 'git.writeRef'
    throw err
  }
}
