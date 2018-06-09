import path from 'path'

import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'
import { accumulateFilesFromOid } from '../utils'

import { resolveRef } from './resolveRef'

/**
 * List all the files in the git index
 *
 * @link https://isomorphic-git.github.io/docs/listFiles.html
 */
export async function listFiles ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    let filenames
    if (ref) {
      const oid = await resolveRef({ gitdir, fs, ref })
      filenames = []
      await accumulateFilesFromOid({ gitdir, fs, oid, filenames, prefix: '' })
    } else {
      await GitIndexManager.acquire(
        { fs, filepath: `${gitdir}/index` },
        async function (index) {
          filenames = index.entries.map(x => x.path)
        }
      )
    }
    return filenames
  } catch (err) {
    err.caller = 'git.listFiles'
    throw err
  }
}
