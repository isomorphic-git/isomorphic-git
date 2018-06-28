import path from 'path'

import { GitObjectManager } from '../managers/GitObjectManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'

/**
 * Create a signed commit
 *
 * @link https://isomorphic-git.github.io/docs/sign.html
 */
export async function sign ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  privateKeys,
  openpgp
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
    const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionInRefFail, { ref: 'HEAD', type })
    }
    let commit = SignedGitCommit.from(object)
    commit = await commit.sign(openpgp, privateKeys)
    const newOid = await GitObjectManager.write({
      fs,
      gitdir,
      type: 'commit',
      object: commit.toObject()
    })
    // Update branch pointer
    // TODO: Use an updateBranch function instead of this.
    const branch = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    await fs.write(path.join(gitdir, branch), newOid + '\n')
  } catch (err) {
    err.caller = 'git.sign'
    throw err
  }
}
