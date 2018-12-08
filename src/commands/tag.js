import { writeRef } from './writeRef'
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

    try {
      // Attempt to get old value
      const oldValue = await GitRefManager.resolve({ fs, gitdir, ref })
      // If found and not forced overwriting
      if (!force) {
        if (oldValue !== value) {
          // It exists and differ from passed value
          throw new GitError(E.RefExistsError, { noun: 'tag', ref: name })
        } else {
          // Nothing to do, as the old value and the new one is the same
          return
        }
      }
    } catch (err) {
      switch (err.name) {
        case E.ResolveRefError:
          // Not found, it's pretty OK
          break
        default: throw err
      }
    }

    await writeRef({ fs, gitdir, ref, value, force: true })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
