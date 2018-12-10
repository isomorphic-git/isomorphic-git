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
  tag,
  object,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const ref = 'refs/tags/' + tag

    // Resolve passed object
    let value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: object || 'HEAD'
    })

    if (!force && await GitRefManager.exists({ fs, gitdir, ref })) {
      throw new GitError(E.RefExistsError, { noun: 'tag', ref: tag })
    }

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
