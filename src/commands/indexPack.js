// @ts-check
import { GitPackIndex } from '../models/GitPackIndex.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {ProgressCallback} [args.onProgress]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.filepath
 *
 * @returns {Promise<{oids: string[]}>}
 */
export async function _indexPack({
  fs,
  cache,
  onProgress,
  dir,
  gitdir,
  filepath,
}) {
  try {
    filepath = join(dir, filepath)
    const pack = await fs.read(filepath)
    const getExternalRefDelta = oid => readObject({ fs, cache, gitdir, oid })
    const idx = await GitPackIndex.fromPack({
      pack,
      getExternalRefDelta,
      onProgress,
    })
    await fs.write(filepath.replace(/\.pack$/, '.idx'), await idx.toBuffer())
    return {
      oids: [...idx.hashes],
    }
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
