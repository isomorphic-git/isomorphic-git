// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'

/**
 *
 * @typedef {Object} BlobObject - The object returned has the following schema:
 * @property {string} oid
 * @property {'blob'} type
 * @property {Buffer} object
 *
 */

/**
 * Read a git blob directly by its SHA-1 object id
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath.
 *
 * @returns {Promise<BlobObject>} Resolves successfully with a blob object description
 * @see BlobObject
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
    const { object, type } = await readObject({
      fs,
      gitdir,
      oid,
      format: 'content'
    })
    if (type !== 'blob') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        oid,
        type,
        expected: 'blob'
      })
    }
    return {
      oid,
      type,
      object
    }
  } catch (err) {
    err.caller = 'git.readBlob'
    throw err
  }
}
