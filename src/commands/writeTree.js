// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {TreeEntry[]} TreeObject
 */

/**
 *
 * @typedef {Object} TreeEntry
 * @property {string} mode - the 6 digit hexadecimal mode
 * @property {string} path - the name of the file or directory
 * @property {string} oid - the SHA-1 object id of the blob or tree
 * @property {'commit'|'blob'|'tree'} type - the type of object
 */

/**
 * Write a tree object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {TreeObject} args.tree - The object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object.
 * @see TreeObject
 * @see TreeEntry
 *
 */
export async function writeTree ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  tree
}) {
  try {
    const fs = new FileSystem(_fs)
    // Convert object to buffer
    const object = GitTree.from(tree).toObject()
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'tree',
      object,
      format: 'content'
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeTree'
    throw err
  }
}
