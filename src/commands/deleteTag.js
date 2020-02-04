// @ts-check
import { deleteRef } from '../commands/deleteRef'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'

/**
 * Delete a local tag ref
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The tag to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteTag({ dir: '$input((/))', ref: '$input((test-tag))' })
 * console.log('done')
 *
 */
export async function deleteTag ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref
}) {
  try {
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'deleteTag',
        parameter: 'ref'
      })
    }
    ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`
    await deleteRef({ fs: _fs, gitdir, ref })
  } catch (err) {
    err.caller = 'git.deleteTag'
    throw err
  }
}
