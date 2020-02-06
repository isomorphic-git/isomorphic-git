// @ts-check
import { GitPackIndex } from '../models/GitPackIndex.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {ProgressCallback} [args.onProgress]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.filepath
 *
 * @returns {Promise<void>}
 */
export async function indexPack ({
  fs,
  onProgress,
  dir,
  gitdir,
  filepath
}) {
  try {
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
