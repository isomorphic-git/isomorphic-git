// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { SignedGitCommit } from '../models/SignedGitCommit.js'
import { readObject } from '../storage/readObject.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create a signed commit
 *
 * <aside>
 * OpenPGP.js is unfortunately licensed under an incompatible license and thus cannot be included in a minified bundle with
 * isomorphic-git which is an MIT/BSD style library, because that would violate the "dynamically linked" stipulation.
 * To use this feature you include openpgp with a separate script tag and pass it in as an argument.
 * </aside>
 *
 * It creates a signed version of whatever commit HEAD currently points to, and then updates the current branch,
 * leaving the original commit dangling.
 *
 * The `privateKeys` argument is a single string in ASCII armor format. However, it is plural "keys" because
 * you can technically have multiple private keys in a single ASCII armor string. The openpgp.sign() function accepts
 * multiple keys, so while I haven't tested it, it should support signing a single commit with multiple keys.
 *
 * @deprecated
 * > **Deprecated**
 * > This command will be removed in the 1.0.0 version of `isomorphic-git` as it is no longer necessary.
 * >
 * > Previously, to sign commits you needed two steps, `commit` and then `sign`.
 * > Now commits can be signed when they are created with the [`commit`](./commit.md) command, provided you use a [`pgp`](./plugin_pgp.md) plugin.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.openpgp - An instance of the [OpenPGP library](https://unpkg.com/openpgp%402.6.2)
 * @param {string} args.privateKeys - A PGP private key in ASCII armor format
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are completed
 *
 * @example
 * let sha = await git.sign({
 *   dir: '$input((/))',
 *   openpgp,
 *   privateKeys: `$textarea((
 * -----BEGIN PGP PRIVATE KEY BLOCK-----
 * ...
 * ))`
 * })
 * console.log(sha)
 *
 */
export async function sign ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  privateKeys,
  openpgp
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionInRefFail, {
        expected: 'commit',
        ref: 'HEAD',
        type
      })
    }
    let commit
    if (openpgp) {
      // Old API
      commit = SignedGitCommit.from(object)
      commit = await commit.sign(openpgp, privateKeys)
    } else {
      // Newer plugin API
      const pgp = cores.get(core).get('pgp')
      commit = GitCommit.from(object)
      commit = await GitCommit.sign(commit, pgp, privateKeys)
    }
    const newOid = await writeObject({
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
    await fs.write(join(gitdir, branch), newOid + '\n')
  } catch (err) {
    err.caller = 'git.sign'
    throw err
  }
}
