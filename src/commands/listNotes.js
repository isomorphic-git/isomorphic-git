// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { join } from '../utils/join'
import { cores } from '../utils/plugins.js'

import { readObject } from './readObject'

/**
 * Show a specified note
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} [args.oid] - The SHA-1 object id of the object to list the note for. If omitted, entries for all notes are returned.
 *
 * @returns {Promise<[Object]>} Resolves successfully with an array of entries containing path and oid matching the request.
 */

export async function listNotes ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs = cores.get(core).get('fs'),
  ref = 'refs/notes/commits',
  oid
}) {
  try {
    const refOid = await GitRefManager.resolve({ gitdir, fs, ref })
    const commit = await readObject({
      gitdir,
      fs,
      oid: refOid,
      format: 'parsed'
    })
    const tree = await readObject({
      gitdir,
      fs,
      oid: commit.object.tree,
      format: 'parsed'
    })
    return tree.object.entries
      .filter(
        entry =>
          entry.mode === '100644' &&
          entry.type === 'blob' &&
          entry.path.length === 40 &&
          /[0-9a-f]{40}/.test(entry.path) &&
          (!oid || entry.path === oid)
      )
      .map(entry => {
        return { path: entry.path, oid: entry.oid }
      })
  } catch (Error) {}
}
