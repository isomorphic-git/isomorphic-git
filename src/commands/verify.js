import path from 'path'

import { GitObjectManager } from '../managers/GitObjectManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'

/**
 * Verify a signed commit
 *
 * @link https://isomorphic-git.github.io/docs/verify.html
 */
export async function verify ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  publicKeys,
  openpgp
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({ fs, gitdir, ref })
    const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionInRefFail, { ref, type })
    }
    let commit = SignedGitCommit.from(object)
    let keys = await commit.listSigningKeys(openpgp)
    let validity = await commit.verify(openpgp, publicKeys)
    if (!validity) return false
    return keys
  } catch (err) {
    err.caller = 'git.verify'
    throw err
  }
}
