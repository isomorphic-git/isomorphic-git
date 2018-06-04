import path from 'path'

import { FileSystem, GitPackIndex } from '../models'

/**
 * Create the .idx file for a given .pack file
 *
 * @link https://isomorphic-git.github.io/docs/indexPack.html
 */
export async function indexPack ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    const pack = await fs.read(path.join(dir, filepath))
    const idx = await GitPackIndex.fromPack({ pack })
    await fs.write(filepath.replace(/\.pack$/, '.idx'), idx.toBuffer())
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
