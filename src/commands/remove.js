import path from 'path'
import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'

/**
 * Remove a file from the git index (aka staging area)
 *
 * Note that this does NOT delete the file in the working directory.
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.filepath - The path to the file to remove to the index.
 * @returns {Promise<void>} - Resolves successfully once the git index has been updated.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * await git.remove({...repo, filepath: '<@README.md@>'})
 * console.log('done')
 */
export async function remove ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  const fs = new FileSystem(_fs)
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      index.delete({ filepath })
    }
  )
  // TODO: return oid?
}
