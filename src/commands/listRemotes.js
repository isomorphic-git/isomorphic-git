import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * List remotes
 *
 * @link https://isomorphic-git.github.io/docs/listRemotes.html
 */
export async function listRemotes ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs')
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
