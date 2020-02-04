// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

/**
 * Delete a local ref
 *
 * > Note: This only deletes loose refs - it should be fixed in the future to delete packed refs as well.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteRef({ dir: '$input((/))', ref: '$input((refs/tags/test-tag))' })
 * console.log('done')
 *
 */
export async function deleteRef ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    await GitRefManager.deleteRef({ fs, gitdir, ref })
  } catch (err) {
    err.caller = 'git.deleteRef'
    throw err
  }
}
