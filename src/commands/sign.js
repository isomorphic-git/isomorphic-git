import path from 'path'

import { GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, SignedGitCommit } from '../models'

/**
 * Create a signed commit
 *
 * OpenPGP.js is a huge library and if you don't need to create or verify signed commits
 * you shouldn't be forced to include that weighty feature in your bundle. That's why this
 * is its own function.
 *
 * It creates a signed version of whatever commit HEAD currently points to, and then updates the current branch,
 * leaving the original commit dangling.
 *
 * The {@link privateKeys} argument is a single string in ASCII armor format. However, it is plural "keys" because
 * you can technically have multiple private keys in a single ASCII armor string. The openpgp.sign() function accepts
 * multiple keys, so while I haven't tested it, it should support signing a single commit with multiple keys.
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.privateKeys - A PGP private key in ASCII armor format.
 * @returns {Promise<string>} - The object ID of the newly created commit.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let sha = await git.sign({
 *   ...repo,
 *   privateKeys: `<<@
 * -----BEGIN PGP PRIVATE KEY BLOCK-----
 * ...
 * @>>`
 * })
 * console.log(sha)
 */
export async function sign ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  privateKeys,
  openpgp
}) {
  const fs = new FileSystem(_fs)
  const oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  if (type !== 'commit') {
    throw new Error(
      `HEAD is not pointing to a 'commit' object but a '${type}' object`
    )
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
}
