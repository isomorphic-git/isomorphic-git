import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * Delete an existing remote
 *
 * @link https://isomorphic-git.github.io/docs/deleteRemote.html
 */
export async function deleteRemote ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs,
  remote
}) {
  try {
    // TODO do I need to check remote/url args presence?
    const config = await GitConfigManager.get({ fs, gitdir })
    const remoteNames = await config.getSubsections('remote')
    if (!remoteNames.includes(remote)) {
      // TODO we need a specific error, isn't it?
      throw new Error(`remote ${remote} does not exist`)
    }
    await config.deleteSection('remote', remote)
    await GitConfigManager.save({ fs, gitdir, config })
  } catch (err) {
    err.caller = 'git.addRemote'
    throw err
  }
}
