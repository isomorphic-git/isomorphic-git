import path from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitObjectManager } from '../managers/GitObjectManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'

/**
 * Reset a file from the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/reset.html
 */
export async function reset ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    const type = 'blob'
    const tree = await log({ gitdir, fs, depth: 1 })
    let oid = tree[0] && tree[0].tree;
    if (oid) {
      try {
        const obj = await readObject({ gitdir, fs, oid, filepath, format: 'deflated' })
        oid = obj && obj.oid;
      } catch (e) {
        oid = null;
      }
    }
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        index.delete({ filepath })
        if (oid) {
          const stats = { ctime: new Date(0), mtime: new Date(0), dev: 0, ino: 0, mode: 0, uid: 0, gid: 0, size: 0 };
          index.insert({ filepath, stats, oid })
        }
      }
    )
    // TODO: return oid?
  } catch (err) {
    err.caller = 'git.reset'
    throw err
  }
}
