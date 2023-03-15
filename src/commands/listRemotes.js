// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 *
 * @returns {Promise<Array<{remote: string, url: string}>>}
 */
export async function _listRemotes({ fs, gitdir }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  const remoteNames = await config.getSubsections('remote')
  const remotes = Promise.all(
    remoteNames.map(async remote => {
      const url = await config.get(`remote.${remote}.url`)
      return { remote, url }
    })
  )
  return remotes
}
