// @ts-check
import '../typedefs.js'

import cleanGitRef from 'clean-git-ref'

import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'

/**
 * Rename a branch
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref - The name of the new branch
 * @param {string} args.oldref - The name of the old branch
 * @param {boolean} [args.checkout = false]
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ dir: '$input((/))', ref: '$input((develop))' })
 * console.log('done')
 *
 */
export async function _renameBranch({
  fs,
  gitdir,
  oldref,
  ref,
  checkout = false,
}) {
  if (ref !== cleanGitRef.clean(ref)) {
    throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
  }

  if (oldref !== cleanGitRef.clean(oldref)) {
    throw new InvalidRefNameError(oldref, cleanGitRef.clean(oldref))
  }

  const fulloldref = `refs/heads/${oldref}`
  const fullnewref = `refs/heads/${ref}`

  const oldexist = await GitRefManager.exists({ fs, gitdir, ref: fulloldref })
  if (!oldexist) {
    throw new NotFoundError(`branch called ${oldref}`)
  }

  const newexist = await GitRefManager.exists({ fs, gitdir, ref: fullnewref })

  if (newexist) {
    throw new AlreadyExistsError('branch', ref, false)
  }

  // Get current HEAD tree oid
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: oldref })
  } catch (e) {
    // Probably an empty repo
  }

  // Create a new ref that points at the current commit
  if (oid) {
    await GitRefManager.writeRef({ fs, gitdir, ref: fullnewref, value: oid })
    await GitRefManager.deleteRef({ fs, gitdir, ref: fulloldref })
  }

  if (checkout) {
    // Update HEAD
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: fullnewref,
    })
  }
}
