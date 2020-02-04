// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'

import { readBlob } from './readBlob'

/**
 * Read the contents of a note
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} [args.oid] - The SHA-1 object id of the object to get the note for.
 *
 * @returns {Promise<Uint8Array>} Resolves successfully with note contents as a Buffer.
 */

export async function readNote ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  oid
}) {
  try {
    const fs = new FileSystem(_fs)

    const parent = await GitRefManager.resolve({ gitdir, fs, ref })
    const { blob } = await readBlob({
      fs: _fs,
      gitdir,
      oid: parent,
      filepath: oid
    })

    return blob
  } catch (err) {
    err.caller = 'git.readNote'
    throw err
  }
}
