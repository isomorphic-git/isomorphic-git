import { GitRefManager } from '../managers/GitRefManager'
import { E, GitError } from '../models/GitError.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a lightweight tag.
 *
 * @link https://isomorphic-git.github.io/docs/tag.html
 */
export async function tag ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  name,
  value = undefined,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const ref = 'refs/tags/' + name

    // Resolve passed value
    value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: value || 'HEAD'
    })

    if (!force) {
      try {
        await GitRefManager.resolve({ fs, gitdir, ref })
        throw new GitError(E.RefExistsError, { noun: 'tag', ref: name })
      } catch (err) {
        if (err.code === 'ResolveRefError') {
          // The ref doesn't exist yet, we are OK
        } else {
          // Rethrow the RefExistsError
          throw err
        }
      }
    }

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
