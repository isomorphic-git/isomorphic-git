import { GitRefManager } from '../managers/GitRefManager'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
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
  ref,
  object,
  force = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'tag',
        parameter: 'ref'
      })
    }

    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`

    // Resolve passed object
    let value = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: object || 'HEAD'
    })

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new GitError(E.RefExistsError, { noun: 'tag', ref })
    }

    await GitRefManager.writeRef({ fs, gitdir, ref, value })
  } catch (err) {
    err.caller = 'git.tag'
    throw err
  }
}
