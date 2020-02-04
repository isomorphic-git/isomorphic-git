// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'

/**
 * Removes the local config entry for a given remote
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.remote - The name of the remote to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteRemote({ dir: '$input((/))', remote: '$input((upstream))' })
 * console.log('done')
 *
 */
export async function deleteRemote ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  remote
}) {
  try {
    const fs = new FileSystem(_fs)
    if (remote === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'deleteRemote',
        parameter: 'remote'
      })
    }
    const config = await GitConfigManager.get({ fs, gitdir })
    await config.deleteSection('remote', remote)
    await GitConfigManager.save({ fs, gitdir, config })
  } catch (err) {
    err.caller = 'git.deleteRemote'
    throw err
  }
}
