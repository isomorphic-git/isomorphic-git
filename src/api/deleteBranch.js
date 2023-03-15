// @ts-check
import '../typedefs.js'

import { _deleteBranch } from '../commands/deleteBranch.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Delete a local branch
 *
 * > Note: This only deletes loose branches - it should be fixed in the future to delete packed branches as well.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The branch to delete
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.deleteBranch({ fs, dir: '/tutorial', ref: 'local-branch' })
 * console.log('done')
 *
 */
export async function deleteBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('ref', ref)
    return await _deleteBranch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.deleteBranch'
    throw err
  }
}
