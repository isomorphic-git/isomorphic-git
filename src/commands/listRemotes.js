// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * List remotes
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
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
  core = 'default',
  dir,
  gitdir = join(dir, '.git')
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
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
