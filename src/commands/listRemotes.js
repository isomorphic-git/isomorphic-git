// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

/**
 * List remotes
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Promise<Array<{remote: string, url: string}>>} Resolves successfully with an array of `{remote, url}` objects
 *
 * @example
 * let remotes = await git.listRemotes({ dir: '$input((/))' })
 * console.log(remotes)
 *
 */
export async function listRemotes ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git')
}) {
  try {
    const fs = new FileSystem(_fs)
    const config = await GitConfigManager.get({ fs, gitdir })
    const remoteNames = await config.getSubsections('remote')
    const remotes = Promise.all(
      remoteNames.map(async remote => {
        const url = await config.get(`remote.${remote}.url`)
        return { remote, url }
      })
    )
    return remotes
  } catch (err) {
    err.caller = 'git.listRemotes'
    throw err
  }
}
