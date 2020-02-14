// @ts-check
import '../typedefs.js'

import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.path
 * @param {string | boolean | number | void} args.value
 * @param {boolean} args.append
 *
 * @returns {Promise<void>} Resolves with the config value

 */
export async function setConfig ({ fs, gitdir, append, path, value }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  if (append) {
    await config.append(path, value)
  } else {
    await config.set(path, value)
  }
  await GitConfigManager.save({ fs, gitdir, config })
}
