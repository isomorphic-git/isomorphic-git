// @ts-check
import '../commands/typedefs.js'

import { init as _init } from '../commands/init.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @returns {Promise<void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.init({ fs, dir: '/tutorial' })
 * console.log('done')
 *
 */
export async function init ({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git')
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    if (!bare) {
      assertParameter('dir', dir)
    }

    return await _init({
      fs: new FileSystem(fs),
      bare,
      dir,
      gitdir
    })
  } catch (err) {
    err.caller = 'git.init'
    throw err
  }
}
