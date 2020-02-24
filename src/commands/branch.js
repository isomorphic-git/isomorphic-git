// @ts-check
import '../typedefs.js'

import cleanGitRef from 'clean-git-ref'

import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { GitRefManager } from '../managers/GitRefManager.js'

/**
 * Create a branch
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 * @param {boolean} [args.checkout = false]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ dir: '$input((/))', ref: '$input((develop))' })
 * console.log('done')
 *
 */
export async function _branch({ fs, gitdir, ref, checkout = false }) {
  if (ref !== cleanGitRef.clean(ref)) {
    throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
  }

  const fullref = `refs/heads/${ref}`

  const exist = await GitRefManager.exists({ fs, gitdir, ref: fullref })
  if (exist) {
    throw new AlreadyExistsError('branch', ref, false)
  }

  // Get current HEAD tree oid
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  } catch (e) {
    // Probably an empty repo
  }

  // Create a new ref that points at the current commit
  if (oid) {
    await GitRefManager.writeRef({ fs, gitdir, ref: fullref, value: oid })
  }

  if (checkout) {
    // Update HEAD
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: fullref,
    })
  }
}
