// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { readObject } from '../storage/readObject.js'
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
 * await git.indexPack({ dir: '$input((/))', filepath: '$input((pack-9cbd243a1caa4cb4bef976062434a958d82721a9.pack))' })
 * console.log('done')
 *
 */
export async function indexPack ({
  fs: _fs,
  onProgress,
  dir,
  gitdir = join(dir, '.git'),
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)

    filepath = join(dir, filepath)
    const pack = await fs.read(filepath)
    const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })
    const idx = await GitPackIndex.fromPack({
      pack,
      getExternalRefDelta,
      onProgress
    })
    await fs.write(filepath.replace(/\.pack$/, '.idx'), await idx.toBuffer())
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
