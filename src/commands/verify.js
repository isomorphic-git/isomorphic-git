import path from 'path'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'
import { readObject } from '../storage/readObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Verify a signed commit
 *
 * @link https://isomorphic-git.github.io/docs/verify.html
 */
export async function verify ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  publicKeys,
  openpgp
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({ fs, gitdir, ref })
    const { type, object } = await readObject({ fs, gitdir, oid })
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
