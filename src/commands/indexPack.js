import path from 'path'
import { FileSystem, GitPackIndex } from '../models'

/**
 * Create the .idx file for a given .pack file
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.filepath - The path to the .pack file to index.
 * @returns {Promise<void>} - Resolves successfully once the .idx file been written.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * await git.indexPack({...repo, filepath: '<@pack-9cbd243a1caa4cb4bef976062434a958d82721a9.pack@>'})
 */
export async function indexPack ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  const fs = new FileSystem(_fs)
  const pack = await fs.read(path.join(dir, filepath))
  const idx = await GitPackIndex.fromPack({ pack })
  await fs.write(filepath.replace(/\.pack$/, '.idx'), idx.toBuffer())
}
