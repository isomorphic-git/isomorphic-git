// @ts-check
import { NotFoundError } from '../errors/NotFoundError.js'
import { dirname } from '../utils/dirname.js'
import { join } from '../utils/join.js'

/**
 * Find the root git directory
 *
 * Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.filepath
 *
 * @returns {Promise<string>} Resolves successfully with a root git directory path
 */
export async function _findRoot({ fs, filepath }) {
  if (await fs.exists(join(filepath, '.git'))) {
    return filepath
  } else {
    const parent = dirname(filepath)
    if (parent === filepath) {
      throw new NotFoundError(`git root for ${filepath}`)
    }
    return _findRoot({ fs, filepath: parent })
  }
}
