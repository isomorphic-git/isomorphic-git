import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * List remotes
 *
 * @link https://isomorphic-git.github.io/docs/listRemotes.html
 */
export async function listRemotes ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs
}) {
  try {
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
