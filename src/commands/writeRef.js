// @ts-check
import cleanGitRef from 'clean-git-ref'

import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Write a ref which refers to the specified SHA-1 object id, or a symbolic ref which refers to the specified ref.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The name of the ref to write
 * @param {string} args.value - When `symbolic` is false, a ref or an SHA-1 object id. When true, a ref starting with `refs/`.
 * @param {boolean} [args.force = false] - Instead of throwing an error if a ref named `ref` already exists, overwrite the existing ref.
 * @param {boolean} [args.symbolic = false] - Whether the ref is symbolic or not.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.writeRef({
 *   dir: '$input((/))',
 *   ref: '$input((refs/heads/another-branch))',
 *   value: '$input((HEAD))'
 * })
 * await git.writeRef({
 *   dir: '$input((/))',
 *   ref: '$input((HEAD))',
 *   value: '$input((refs/heads/another-branch))',
 *   force: $input((true)),
 *   symbolic: $input((true))
 * })
 * console.log('done')
 *
 */
export async function writeRef ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref,
  value,
  force = false,
  symbolic = false
}) {
  try {
    const fs = new FileSystem(_fs)

    if (ref !== cleanGitRef.clean(ref)) {
      throw new GitError(E.InvalidRefNameError, {
        verb: 'write',
        noun: 'ref',
        ref,
        suggestion: cleanGitRef.clean(ref)
      })
    }

    if (!force && (await GitRefManager.exists({ fs, gitdir, ref }))) {
      throw new GitError(E.RefExistsError, { noun: 'ref', ref })
    }

    if (symbolic) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir,
        ref,
        value
      })
    } else {
      value = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: value
      })
      await GitRefManager.writeRef({
        fs,
        gitdir,
        ref,
        value
      })
    }
  } catch (err) {
    err.caller = 'git.writeRef'
    throw err
  }
}
