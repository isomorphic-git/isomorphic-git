// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { TREE } from './TREE.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 * 
 * @typedef {('rm'|'write'|'overwrite'|'mkdir'|'rmdir'|'noop'|'rmdir-write'|'rm-mkdir')} TreePatchOp
 */

/**
 *
 * @typedef {Object} TreePatch - The object returned has the following schema:
 * @property {string} filepath - The file path
 * @property {TreePatchOp} op - The filesystem operation to perform
 * @property {string|null} before - The SHA-1 object id from the before tree
 * @property {string|null} after - The SHA-1 object id from the after tree
 *
 */

/**
 * Compute a TreePatch[] from a before and after commit.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.fullname = false] - Return the full path (e.g. "refs/heads/master") instead of the abbreviated form.
 * @param {string} args.before - The SHA-1 object id of the first commit
 * @param {string} args.after - The SHA-1 object id of the second commit
 *
 * @returns {Promise<TreePatch[]>} The name of the current branch or undefined if the HEAD is detached.
 * @see TreePatch
 * @see TreePatchOp
 *
 * @example
 * // Get the current branch name
 * let branch = await git.diffTree({ dir: '$input((/))', fullname: $input((false)) })
 * console.log(branch)
 *
 */
export async function diffTree ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  before,
  after,
}) {
  try {
    const fs = new FileSystem(_fs)
    const beforeTree = TREE({ core, dir, gitdir, fs, ref: before })
    const afterTree = TREE({ core, dir, gitdir, fs, ref: after })

    let results = await walkBeta1({
      trees: [beforeTree, afterTree],
      map: async function ([before, after]) {
        if (before.fullpath === '.') return
        await Promise.all([before.populateStat(), after.populateStat()])
        await Promise.all([before.populateHash(), after.populateHash()])
        const op = computeOp(before, after)
        if (op === 'noop') return
        return {
          filepath: before.fullpath,
          op,
          before: before.oid,
          after: after.oid,
        }
      }
    })
    return results
  } catch (err) {
    err.caller = 'git.diffTree'
    throw err
  }
}

/**
 * 
 * @param {import('./walkBeta1.js').WalkerEntry} before 
 * @param {import('./walkBeta1.js').WalkerEntry} after 
 * 
 * @returns {TreePatchOp}
 */
function computeOp (before, after) {
  if (before.oid === after.oid) return 'noop'
  // Note: here we ignore our handy `.exists` and just coerce `.type` to undefined lol
  switch (`${before.type}-${after.type}`) {
    case 'blob-blob': return 'overwrite'
    case 'tree-tree': return 'noop'
    case 'blob-tree': return 'rm-mkdir'
    case 'tree-blob': return 'rmdir-write'
    case 'undefined-blob': return 'write'
    case 'undefined-tree': return 'mkdir'
    case 'blob-undefined': return 'rm'
    case 'tree-undefined': return 'rmdir'
  }
}
