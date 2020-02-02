// @ts-check
import '../commands/typedefs.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'
import { resolveTree } from '../utils/resolveTree.js'

/**
 *
 * @typedef {Object} ReadTreeResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tree
 * @property {TreeObject} tree - the parsed tree object
 */

/**
 * Read a tree object directly
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The SHA-1 object id to get. Annotated tags and commits are peeled.
 * @param {string} [args.filepath] - Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the tree object at that filepath.
 *
 * @returns {Promise<ReadTreeResult>} Resolves successfully with a git tree object
 * @see ReadTreeResult
 * @see TreeObject
 * @see TreeEntry
 *
 */
export async function readTree ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  oid,
  filepath = undefined
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
    if (filepath !== undefined) {
      oid = await resolveFilepath({ fs, gitdir, oid, filepath })
    }
    const { tree, oid: treeOid } = await resolveTree({ fs, gitdir, oid })
    const result = {
      oid: treeOid,
      tree: tree.entries()
    }
    return result
  } catch (err) {
    err.caller = 'git.readTree'
    throw err
  }
}
