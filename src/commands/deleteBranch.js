// @ts-check
import { _currentBranch } from '../commands/currentBranch'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { E, GitError } from '../models/GitError.js'

/**
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref
 *
 * @returns {Promise<void>}
 */
export async function _deleteBranch({ fs, gitdir, ref }) {
  const exist = await GitRefManager.exists({ fs, gitdir, ref })
  if (!exist) {
    throw new NotFoundError(ref)
  }

  const fullRef = await GitRefManager.expand({ fs, gitdir, ref })
  const currentRef = await _currentBranch({ fs, gitdir, fullname: true })
  if (fullRef === currentRef) {
    throw new GitError(E.BranchDeleteError, { ref })
  }

  // Delete a specified branch
  await GitRefManager.deleteRef({ fs, gitdir, ref: fullRef })
}
