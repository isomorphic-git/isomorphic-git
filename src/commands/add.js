import path from 'path'

import { GitIndexManager, GitObjectManager } from '../managers'
import { FileSystem } from '../models'

/**
 * @external {FSModule} http://ghub.io/browserfs
 */

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.filepath - The path to the file to add to the index.
 * @returns {Promise<void>} - Resolves successfully once the git index has been updated.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * await new Promise((resolve, reject) => fs.writeFile(
 *   '<@README.md@>',
 *   `<<@# TEST@>>`,
 *   (err) => err ? reject(err) : resolve()
 * ))
 * await git.add({...repo, filepath: '<@README.md@>'})
 * console.log('done')
 */
export async function add ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  const fs = new FileSystem(_fs)
  const type = 'blob'
  const object = await fs.read(path.join(dir, filepath))
  if (object === null) throw new Error(`Could not read file '${filepath}'`)
  const oid = await GitObjectManager.write({ fs, gitdir, type, object })
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      let stats = await fs._lstat(path.join(dir, filepath))
      index.insert({ filepath, stats, oid })
    }
  )
  // TODO: return oid?
}
