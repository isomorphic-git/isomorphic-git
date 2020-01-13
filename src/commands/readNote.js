// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'
import { cores } from '../utils/plugins.js'

import { readBlob } from './readBlob'

/**
 * Read the contents of a note
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} [args.oid] - The SHA-1 object id of the object to get the note for.
 *
 * @returns {Promise<Buffer>} Resolves successfully with note contents as a Buffer.
 */

export async function readNote ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'refs/notes/commits',
  oid
}) {
  try {
    const fs = new FileSystem(_fs)

    const parent = await GitRefManager.resolve({ gitdir, fs, ref })
    const { blob } = await readBlob({
      gitdir,
      fs,
      oid: parent,
      filepath: oid
    })

    return blob
  } catch (err) {
    err.caller = 'git.readNote'
    throw err
  }
}
