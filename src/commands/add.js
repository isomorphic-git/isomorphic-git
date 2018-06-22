import path from 'path'

import { GitIndexManager, GitObjectManager } from '../managers'
import { E, FileSystem, GitError } from '../models'

/**
 * Add a file to the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/add.html
 */
export async function add ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    const type = 'blob'
    const object = await fs.read(path.join(dir, filepath))
    if (object === null) throw new GitError(E.FileReadError, { filepath })
    const oid = await GitObjectManager.write({ fs, gitdir, type, object })
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        let stats = await fs._lstat(path.join(dir, filepath))
        index.insert({ filepath, stats, oid })
      }
    )
    // TODO: return oid?
  } catch (err) {
    err.caller = 'git.add'
    throw err
  }
}
