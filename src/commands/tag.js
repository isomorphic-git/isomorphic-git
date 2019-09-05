// @ts-check
import { GitRefManager } from '../managers/GitRefManager'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a lightweight tag
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the tag
 * @param {string} [args.object = 'HEAD'] - What oid the tag refers to. (Will resolve to oid if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used.
 * @param {boolean} [args.force = false] - Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.tag({ dir: '$input((/))', ref: '$input((test-tag))' })
 * console.log('done')
 *
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
    const value = await GitRefManager.resolve({
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
