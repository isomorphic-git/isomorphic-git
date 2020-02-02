// @ts-check
import '../commands/typedefs.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Write a tree object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
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
  tree
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
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
