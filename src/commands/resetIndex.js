import path from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitObjectManager } from '../managers/GitObjectManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

import { readObject } from './readObject'

/**
 * Reset a file in the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/resetIndex.html
 */
export async function resetIndex ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  filepath,
  ref = 'HEAD'
}) {
  try {
    const fs = new FileSystem(_fs)
    // Resolve commit
    let oid = await GitRefManager.resolve({ fs, gitdir, ref })
    let workdirOid
    try {
      // Resolve blob
      const obj = await readObject({ gitdir, fs, oid, filepath, format: 'deflated' })
      oid = obj && obj.oid
    } catch (e) {
      // This means we're resetting the file to a "deleted" state
      oid = null
    }
    // For files that aren't in the workdir use zeros
    let stats = {
      ctime: new Date(0),
      mtime: new Date(0),
      dev: 0,
      ino: 0,
      mode: 0,
      uid: 0,
      gid: 0,
      size: 0
    }
    // If the file exists in the workdir...
    const object = await fs.read(path.join(dir, filepath))
    if (object) {
      // ... and has the same hash as the desired state...
      workdirOid = await GitObjectManager.hash({
        gitdir,
        type: 'blob',
        object
      })
      if (oid === workdirOid) {
        // ... use the workdir Stats object
        stats = await fs.lstat(path.join(dir, filepath))
      }
    }
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        index.delete({ filepath })
        if (oid) {
          index.insert({ filepath, stats, oid })
        }
      }
    )
  } catch (err) {
    err.caller = 'git.reset'
    throw err
  }
}
