// @ts-check
import '../commands/typedefs.js'

import { indexPack as _indexPack } from '../commands/indexPack.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Create the .idx file for a given .pack file
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the .pack file to index
 *
 * @returns {Promise<void>} Resolves when filesystem operations are complete
 *
 * @example
 * let packfiles = await pfs.readdir('/tutorial/.git/objects/pack')
 * packfiles = packfiles.filter(name => name.endsWith('.pack'))
 * console.log('packfiles', packfiles)
 *
 * await git.indexPack({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: `.git/objects/pack/${packfiles[0]}`,
 *   onProgress (evt) {
 *     console.log(`${evt.phase}: ${evt.loaded} / ${evt.total}`)
 *   }
 * })
 * console.log('done')
 *
 */
export async function indexPack ({
  fs,
  onProgress,
  dir,
  gitdir = join(dir, '.git'),
  filepath
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', dir)
    assertParameter('filepath', filepath)

    return await _indexPack({
      fs: new FileSystem(fs),
      onProgress,
      dir,
      gitdir,
      filepath
    })
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
