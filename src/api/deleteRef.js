// @ts-check
import '../commands/typedefs.js'

import { deleteRef as _deleteRef } from '../commands/deleteRef.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Delete a local ref
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
export async function deleteRef ({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs)
    assertParameter('ref', ref)
    return await _deleteRef({
      fs: new FileSystem(fs),
      gitdir,
      ref
    })
  } catch (err) {
    err.caller = 'git.deleteRef'
    throw err
  }
}
