// @ts-check
import '../commands/typedefs.js'

import { add as _add } from '../commands/add.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to add to the index
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await new Promise((resolve, reject) => fs.writeFile(
 *   '$input((/README.md))',
 *   `$textarea((# TEST))`,
 *   (err) => err ? reject(err) : resolve()
 * ))
 * await git.add({ dir: '$input((/))', filepath: '$input((README.md))' })
 * console.log('done')
 *
 */
export async function add ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath
}) {
  try {
    assertParameter('addRemote', 'fs', fs)
    assertParameter('addRemote', 'dir', dir)
    assertParameter('addRemote', 'gitdir', gitdir)
    assertParameter('addRemote', 'filepath', filepath)
    return await _add({ fs: new FileSystem(fs), dir, gitdir, filepath })
  } catch (err) {
    err.caller = 'git.add'
    throw err
  }
}
