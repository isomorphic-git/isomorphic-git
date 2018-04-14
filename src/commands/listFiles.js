import path from 'path'

import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List all the tracked files in a repo
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @returns {Promise<string[]>} - Resolves successfully with an array of file paths.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let files = await git.listFiles(repo)
 * console.log(files)
 */
export async function listFiles ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  const fs = new FileSystem(_fs)
  let filenames
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      filenames = index.entries.map(x => x.path)
    }
  )
  return filenames
}
