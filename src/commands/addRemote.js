import path from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * Add a new remote
 *
 * @link https://isomorphic-git.github.io/docs/addRemote.html
 */
export async function addRemote ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs,
  remote,
  url
}) {
  try {
    // TODO do I need to check remote/url args presence?
    const config = await GitConfigManager.get({ fs, gitdir })
    const remoteNames = await config.getSubsections('remote')
    if (remoteNames.includes(remote)) {
      // TODO we need a specific error, isn't it?
      throw new Error(`remote ${remote} already exists`)
    }
    await config.set(`remote.${remote}.url`, url)
    // TODO do we need to set a fetch refspec?
    await GitConfigManager.save({ fs, gitdir, config })
  } catch (err) {
    err.caller = 'git.addRemote'
    throw err
  }
}
