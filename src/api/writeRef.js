// @ts-check
import cleanGitRef from 'clean-git-ref'

import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import validRef from '../utils/isValidRef.js'
import { join } from '../utils/join.js'

/**
 * Write a ref which refers to the specified SHA-1 object id, or a symbolic ref which refers to the specified ref.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
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
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'refs/heads/another-branch',
 *   value: 'HEAD'
 * })
 * await git.writeRef({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'HEAD',
 *   value: 'refs/heads/another-branch',
 *   force: true,
 *   symbolic: true
 * })
 * console.log('done')
 *
 */
export async function writeRef({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  value,
  force = false,
  symbolic = false,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    assertParameter('value', value)

    const fs = new FileSystem(_fs)

    if (!validRef(ref, true)) {
      throw new InvalidRefNameError(ref, cleanGitRef.clean(ref))
    }

    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })
    if (
      !force &&
      (await GitRefManager.exists({ fs, gitdir: updatedGitdir, ref }))
    ) {
      throw new AlreadyExistsError('ref', ref)
    }

    if (symbolic) {
      await GitRefManager.writeSymbolicRef({
        fs,
        gitdir: updatedGitdir,
        ref,
        value,
      })
    } else {
      value = await GitRefManager.resolve({
        fs,
        gitdir: updatedGitdir,
        ref: value,
      })
      await GitRefManager.writeRef({
        fs,
        gitdir: updatedGitdir,
        ref,
        value,
      })
    }
  } catch (err) {
    err.caller = 'git.writeRef'
    throw err
  }
}
