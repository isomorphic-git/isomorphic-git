// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Verify a signed commit or tag
 *
 * For now, key management is beyond the scope of isomorphic-git's PGP features.
 * It is up to you to figure out what the commit's or tag's public key _should_ be.
 * I would use the "author" or "committer" name and email, and look up
 * that person's public key from a trusted source such as the GitHub API.
 *
 * The function returns `false` if any of the signatures on a signed git commit are invalid.
 * Otherwise, it returns an array of the key ids that were used to sign it.
 *
 * The `publicKeys` argument is a single string in ASCII armor format. However, it is plural "keys" because
 * you can technically have multiple public keys in a single ASCII armor string. While I haven't tested it, it
 * should support verifying a single commit signed with multiple keys. Hence why the returned result is an array of key ids.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - A reference to the commit or tag to verify
 * @param {string} args.publicKeys - A PGP public key in ASCII armor format.
 * @param {OpenPGP} [args.openpgp] - [deprecated] An instance of the [OpenPGP library](https://unpkg.com/openpgp@2.6.2). Deprecated in favor of using a [PGP plugin](./plugin_pgp.md).
 *
 * @returns {Promise<false | string[]>} The value `false` or the valid key ids (in hex format) used to sign the commit.
 *
 * @example
 * let keyids = await git.verify({
 *   dir: '$input((/))',
 *   openpgp,
 *   ref: '$input((HEAD))',
 *   publicKeys: `$textarea((
 * -----BEGIN PGP PUBLIC KEY BLOCK-----
 * ...
 * ))`
 * })
 * console.log(keyids)
 *
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
    if (type !== 'commit' && type !== 'tag') {
      throw new GitError(E.ObjectTypeAssertionInRefFail, {
        expected: 'commit/tag',
        ref,
        type
      })
    }
    if (openpgp) {
      // Old API
      const commit = SignedGitCommit.from(object)
      const keys = await commit.listSigningKeys(openpgp)
      const validity = await commit.verify(openpgp, publicKeys)
      if (!validity) return false
      return keys
    } else {
      // Newer plugin API
      const pgp = cores.get(core).get('pgp')
      if (type === 'commit') {
        const commit = GitCommit.from(object)
        const { valid, invalid } = await GitCommit.verify(
          commit,
          pgp,
          publicKeys
        )
        if (invalid.length > 0) return false
        return valid
      } else if (type === 'tag') {
        const tag = GitAnnotatedTag.from(object)
        const { valid, invalid } = await GitAnnotatedTag.verify(
          tag,
          pgp,
          publicKeys
        )
        if (invalid.length > 0) return false
        return valid
      }
    }
  } catch (err) {
    err.caller = 'git.verify'
    throw err
  }
}
