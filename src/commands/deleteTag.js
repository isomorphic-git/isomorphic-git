// @ts-check
import { deleteRef } from '../commands/deleteRef'

/**
 * Delete a local tag ref
 *
 * @param {Object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} args.ref - The tag to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteTag({ dir: '$input((/))', ref: '$input((test-tag))' })
 * console.log('done')
 *
 */
export async function deleteTag ({ fs, gitdir, ref }) {
  ref = ref.startsWith('refs/tags/') ? ref : `refs/tags/${ref}`
  await deleteRef({ fs, gitdir, ref })
}
