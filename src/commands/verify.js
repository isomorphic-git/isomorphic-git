import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Verify a signed commit
 *
 * @link https://isomorphic-git.github.io/docs/verify.html
 */
export async function verify ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
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
    if (openpgp) {
      // Old API
      let commit = SignedGitCommit.from(object)
      let keys = await commit.listSigningKeys(openpgp)
      let validity = await commit.verify(openpgp, publicKeys)
      if (!validity) return false
      return keys
    } else {
      // Newer plugin API
      let pgp = cores.get(core).get('pgp')
      let commit = GitCommit.from(object)
      let { valid, invalid } = await GitCommit.verify(commit, pgp, publicKeys)
      if (invalid.length > 0) return false
      return valid
    }
  } catch (err) {
    err.caller = 'git.verify'
    throw err
  }
}
