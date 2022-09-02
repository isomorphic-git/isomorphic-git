// @ts-check
import '../typedefs.js'

import { _branch } from '../commands/branch.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Create a branch
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - What to name the branch
 * @param {string} [args.object = 'HEAD'] - What oid to use as the start point. Accepts a symbolic ref.
 * @param {boolean} [args.checkout = false] - Update `HEAD` to point at the newly created branch
 * @param {boolean} [args.force = false] - Instead of throwing an error if a branched named `ref` already exists, overwrite the existing branch.
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.branch({ fs, dir: '/tutorial', ref: 'develop' })
 * console.log('done')
 *
 */
export async function branch({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref,
  object,
  checkout = false,
  force = false,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)
    return await _branch({
      fs: new FileSystem(fs),
      gitdir,
      ref,
      object,
      checkout,
      force,
    })
  } catch (err) {
    err.caller = 'git.branch'
    throw err
  }
}
