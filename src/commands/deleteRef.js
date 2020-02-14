// @ts-check
import '../typedefs.js'

import { GitRefManager } from '../managers/GitRefManager.js'

/**
 * Delete a local ref
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 */
export async function deleteRef ({ fs, gitdir, ref }) {
  await GitRefManager.deleteRef({ fs, gitdir, ref })
}
