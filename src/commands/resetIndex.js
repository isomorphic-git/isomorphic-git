// @ts-check
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { hashObject } from '../utils/hashObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { readObject } from './readObject.js'

/**
 * Reset a file in the git index (aka staging area)
 *
 * Note that this does NOT modify the file in the working directory.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to reset in the index
 * @param {string} [args.ref = 'HEAD'] - A ref to the commit to use
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await git.resetIndex({ dir: '$input((/))', filepath: '$input((README.md))' })
 * console.log('done')
 *
 */
export async function resetIndex ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
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
      const obj = await readObject({
        gitdir,
        fs,
        oid,
        filepath,
        format: 'deflated'
      })
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
    const object = dir && (await fs.read(join(dir, filepath)))
    if (object) {
      // ... and has the same hash as the desired state...
      workdirOid = await hashObject({
        gitdir,
        type: 'blob',
        object
      })
      if (oid === workdirOid) {
        // ... use the workdir Stats object
        stats = await fs.lstat(join(dir, filepath))
      }
    }
    await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
      index.delete({ filepath })
      if (oid) {
        index.insert({ filepath, stats, oid })
      }
    })
  } catch (err) {
    err.caller = 'git.reset'
    throw err
  }
}
