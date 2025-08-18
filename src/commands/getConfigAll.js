
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * //TODO: Upgrade to native FileSystem API
 * @param {string} args.gitdir
 * @param {string} args.path
 *
 * @returns {Promise<Array<any>>} Resolves with an array of the config value
 *
 */
export async function _getConfigAll({ fs, gitdir, path }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  return config.getall(path)
}
