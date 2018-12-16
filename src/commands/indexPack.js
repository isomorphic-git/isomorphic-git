import { FileSystem } from '../models/FileSystem.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create the .idx file for a given .pack file
 *
 * @link https://isomorphic-git.github.io/docs/indexPack.html
 */
export async function indexPack ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
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
      emitter,
      emitterPrefix
    })
    await fs.write(filepath.replace(/\.pack$/, '.idx'), idx.toBuffer())
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
