import path from 'path'

import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List all the files in the git index
 *
 * @link https://isomorphic-git.github.io/docs/listFiles.html
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
