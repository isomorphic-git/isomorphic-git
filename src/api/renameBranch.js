// @ts-check
import '../typedefs.js'

import { _renameBranch } from '../commands/renameBranch.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Rename a branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the branch
 * @param {string} args.oldref - What the name of the branch was
 * @param {boolean} [args.checkout = false] - Update `HEAD` to point at the newly created branch
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.renameBranch({ fs, dir: '/tutorial', ref: 'main', oldref: 'master' })
 * console.log('done')
 *
 */
export async function renameBranch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  oldref,
  checkout = false,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    assertParameter('oldref', oldref)
    return await _renameBranch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
      oldref,
      checkout,
    })
  } catch (err) {
    err.caller = 'git.renameBranch'
    throw err
  }
}
