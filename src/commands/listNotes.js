// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join'
import { cores } from '../utils/plugins.js'

import { readTree } from './readTree'
import { E } from '../models/GitError.js'

/**
 * List all the object notes
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 *
 * @returns {Promise<Array<{target: string, note: string}>>} Resolves successfully with an array of entries containing SHA-1 object ids of the note and the object the note targets
 */

export async function listNotes ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'refs/notes/commits'
}) {
  try {
    const fs = new FileSystem(_fs)
    let refOid
    try {
      refOid = await GitRefManager.resolve({ gitdir, fs, ref })
    } catch (err) {
      if (err.code === E.RefNotExistsError) {
        return []
      }
    }
    const result = await readTree({
      gitdir,
      fs,
      oid: refOid
    })
    const notes = result.tree.map(entry => ({ target: entry.path, note: entry.oid }))
    return notes
  } catch (err) {
    err.caller = 'git.listNotes'
    throw err
  }
}
