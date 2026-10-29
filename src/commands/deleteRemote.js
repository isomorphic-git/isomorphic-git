// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.remote
 *
 * @returns {Promise<void>}
 */
export async function _deleteRemote({ fs, gitdir, remote }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  // Leave the config file alone (or absent) when the remote isn't in it
  if ((await config.getSubsections('remote')).includes(remote)) {
    await config.deleteSection('remote', remote)
    await GitConfigManager.save({ fs, gitdir, config })
  }
}
