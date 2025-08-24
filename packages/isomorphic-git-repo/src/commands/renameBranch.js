// @ts-check
import cleanGitRef from 'clean-git-ref'

import { _currentBranch } from '../commands/currentBranch.js'
import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import '../typedefs.js'

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

  const newexist = await GitRefManager.exists({ fs, gitdir, ref: fullnewref })

  if (newexist) {
    throw new AlreadyExistsError('branch', ref, false)
  }

  const value = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: fulloldref,
    depth: 1,
  })

  await GitRefManager.writeRef({ fs, gitdir, ref: fullnewref, value })
  await GitRefManager.deleteRef({ fs, gitdir, ref: fulloldref })

  const fullCurrentBranchRef = await _currentBranch({
    fs,
    gitdir,
    fullname: true,
  })
  const isCurrentBranch = fullCurrentBranchRef === fulloldref

  if (checkout || isCurrentBranch) {
    // Update HEAD
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: fullnewref,
    })
  }
}
