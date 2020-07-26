// @ts-check
import '../typedefs.js'

import { FileSystem } from '../models/FileSystem.js'
import { readPackIndex } from '../storage/readPackIndex.js'
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
 * @returns {Promise<{oids: string[]}>} Resolves with a list of the SHA-1 object ids contained in the packfile
 *
 * @example
 * let idxs = await fs.promises.readdir('/tutorial/.git/objects/pack')
 * idxs = idxs.filter(name => name.endsWith('.idx'))
 * console.log('packfile indexes', idxs)
 *
 * const { oids } = await git.listPackIndex({
 *   fs,
 *   dir: '/tutorial',
 *   filepath: `.git/objects/pack/${idxs[0]}`,
 * })
 * console.log(oids)
 *
 */
export async function listPackIndex({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('filepath', filepath)

    const filename = join(dir, filepath)
    // @ts-ignore
    const p = await readPackIndex({
      fs: new FileSystem(fs),
      filename,
    })
    return { oids: [...p.hashes] }
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
