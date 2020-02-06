// @ts-check
import '../commands/typedefs.js'

import { listFiles as _listFiles } from '../commands/listFiles'
import { join } from '../utils/join'
import { assertParameter } from '../utils/assertParameter.js'
import { FileSystem } from '../models/FileSystem.js'

/**
 * List all the files in the git index or a commit
 *
 * > Note: This function is efficient for listing the files in the staging area, but listing all the files in a commit requires recursively walking through the git object store.
 * > If you do not require a complete list of every file, better can be achieved by using [readObject](./readObject.html) directly and ignoring subdirectories you don't care about.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - Return a list of all the files in the commit at `ref` instead of the files currently in the git index (aka staging area)
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of filepaths
 *
 * @example
 * // All the files in the previous commit
 * let files = await git.listFiles({ dir: '$input((/))', ref: '$input((HEAD))' })
 * console.log(files)
 * // All the files in the current staging area
 * files = await git.listFiles({ dir: '$input((/))' })
 * console.log(files)
 *
 */
export async function listFiles ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)

    return await _listFiles({
      fs: new FileSystem(fs),
      gitdir,
      ref
    })
  } catch (err) {
    err.caller = 'git.listFiles'
    throw err
  }
}
