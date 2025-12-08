// @ts-check
import '../typedefs.js'

import { _deleteTag } from '../commands/deleteTag.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
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
 * await git.deleteTag({ fs, dir: '/tutorial', ref: 'test-tag' })
 * console.log('done')
 *
 */
export async function deleteTag({ fs, dir, gitdir = join(dir, '.git'), ref }) {
  try {
    assertParameter('fs', fs)
    assertParameter('ref', ref)
    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _deleteTag({
      fs: fsp,
      gitdir: updatedGitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.deleteTag'
    throw err
  }
}
