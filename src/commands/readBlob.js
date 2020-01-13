// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveBlob } from '../utils/resolveBlob.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'

/**
 *
 * @typedef {Object} ReadBlobResult - The object returned has the following schema:
 * @property {string} oid
 * @property {Buffer} blob
 *
 */

/**
 * Read a blob object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags, commits, and trees are peeled.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the blob object at that filepath.
 *
 * @returns {Promise<ReadBlobResult>} Resolves successfully with a blob object description
 * @see ReadBlobResult
 *
 * @example
 * // Get the contents of 'README.md' in the master branch.
 * let commitOid = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
 * console.log(commitOid)
 * let { object: blob } = await git.readBlob({
 *   dir: '$input((/))',
 *   oid: $input((commitOid)),
 *   $textarea((filepath: 'README.md'
 * })
 * console.log(blob.toString('utf8'))
 *
 */
export async function readBlob ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oid,
  filepath = undefined
}) {
  try {
    const fs = new FileSystem(_fs)
    if (filepath !== undefined) {
      oid = await resolveFilepath({ fs, gitdir, oid, filepath })
    }
    const blob = await resolveBlob({
      fs,
      gitdir,
      oid
    })
    return blob
  } catch (err) {
    err.caller = 'git.readBlob'
    throw err
  }
}
