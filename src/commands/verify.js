import path from 'path'

import { GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, SignedGitCommit } from '../models'

/**
 * Verify a signed commit
 *
 * It is up to you to figure out what the commit's public key *should* be.
 * I would use the "author" or "committer" name and email, and look up
 * that person's public key from a trusted source such as the Github API.
 *
 * The function returns false if any of the signatures on a signed git commit are invalid.
 * Otherwise, it returns an array of the key ids that were used to sign it.
 *
 * The {@link publicKeys} argument is a single string in ASCII armor format. However, it is plural "keys" because
 * you can technically have multiple public keys in a single ASCII armor string. While I haven't tested it, it
 * should support verifying a single commit signed with multiple keys. Hence why the returned result is an array of key ids.
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.ref - A reference to the commit to verify
 * @param {string} args.publicKeys - A PGP public key in ASCII armor format.
 * @returns {Promise<false|Array<string>>} - The key ids used to sign the commit, in hex format.
 *
 * @example
 * let repo = {fs, dir: '.'}
 * let keyids = await git.verify({
 *   ...repo,
 *   ref: '<@HEAD@>',
 *   publicKeys: `<<@
 * -----BEGIN PGP PUBLIC KEY BLOCK-----
 * ...
 * @>>`
 * })
 * console.log(keyids)
 */
export async function verify ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  publicKeys,
  openpgp
}) {
  const fs = new FileSystem(_fs)
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  if (type !== 'commit') {
    throw new Error(
      `'ref' is not pointing to a 'commit' object but a '${type}' object`
    )
  }
  let commit = SignedGitCommit.from(object)
  let keys = await commit.listSigningKeys(openpgp)
  let validity = await commit.verify(openpgp, publicKeys)
  if (!validity) return false
  return keys
}
