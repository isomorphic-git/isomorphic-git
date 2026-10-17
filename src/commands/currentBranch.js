// @ts-check
import '../typedefs.js'

import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { abbreviateRef } from '../utils/abbreviateRef.js'

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {boolean} [args.fullname = false] - Return the full path (e.g. "refs/heads/main") instead of the abbreviated form.
 * @param {boolean} [args.test = false] - If the current branch doesn't actually exist (such as right after git init) then return `undefined`.
 *
 * @returns {Promise<string|void>} The name of the current branch or undefined if the HEAD is detached.
 *
 */
export async function _currentBranch({
  fs,
  gitdir,
  fullname = false,
  test = false,
}) {
  const ref = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
    depth: 2,
  })
  if (test) {
    try {
      await GitRefManager.resolve({ fs, gitdir, ref })
    } catch (err) {
      if (err instanceof NotFoundError) return
      throw err
    }
  }
  // Return `undefined` for detached HEAD
  if (!ref.startsWith('refs/')) return
  return fullname ? ref : abbreviateRef(ref)
}
