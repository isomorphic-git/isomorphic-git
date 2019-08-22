// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { TREE } from './TREE.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 *
 * @typedef {('chmod+x'|'chmod-x'|'mkdir'|'noop'|'rm'|'rmdir'|'write')} FileSystemFn
 */

/**
 *
 * @typedef {Object} TreePatch - The object returned has the following schema:
 * @property {string} basename - The file name
 * @property {FileSystemFn[]} ops - The filesystem operation to perform
 * @property {string|null} before - The SHA-1 object id from the before tree
 * @property {string|null} after - The SHA-1 object id from the after
 * @property {TreePatch[]} [subOps] - Child patches of this patch
 * @property {TreePatch[]} [conflicts] - Child patches of this patch
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
 * @returns {Promise<TreePatch>} The name of the current branch or undefined if the HEAD is detached.
 * @see TreePatch
 * @see FileSystemFn
 *
 */
export async function _diffTree ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  before,
  after
}) {
  try {
    const fs = new FileSystem(_fs)
    const beforeTree = TREE({ core, dir, gitdir, fs, ref: before })
    const afterTree = TREE({ core, dir, gitdir, fs, ref: after })

    const results = await walkBeta1({
      trees: [beforeTree, afterTree],
      map: async function ([before, after]) {
        await Promise.all([before.populateStat(), after.populateStat()])
        await Promise.all([before.populateHash(), after.populateHash()])
        const ops = computeOps(before, after)
        return {
          basename: before.basename,
          before: before.oid,
          after: after.oid,
          ops
        }
      },
      /**
       * @param {TreePatch} [parent]
       * @param {TreePatch[]} children
       */
      reduce: async (parent, children) => {
        if (children.length === 0) {
          return parent
        } else {
          const subOps = children.filter(
            child =>
              child.ops.length > 0 || (child.subOps && child.subOps.length > 0)
          ) // remove undefineds
          if (subOps.length > 0) parent.subOps = subOps
          return parent
        }
      }
    })
    return results
  } catch (err) {
    err.caller = 'git._diffTree'
    throw err
  }
}

/**
 *
 * @param {import('./walkBeta1.js').WalkerEntry} before
 * @param {import('./walkBeta1.js').WalkerEntry} after
 *
 * @returns {FileSystemFn[]}
 */
function computeOps (before, after) {
  const ops = computeMajorOp(before, after)
  // If mode changed, add a mode change op.
  // Note: the conditions are slightly asymetrical because we need to apply chmod+x to newly created files,
  // but not chmod-x because files are chmod-x by default.
  if (before.mode === '100755' && after.mode === '100644') {
    ops.push('chmod-x')
  } else if (before.mode !== '100755' && after.mode === '100755') {
    ops.push('chmod+x')
  }
  return ops
}

/**
 *
 * @param {import('./walkBeta1.js').WalkerEntry} before
 * @param {import('./walkBeta1.js').WalkerEntry} after
 *
 * @returns {FileSystemFn[]}
 */
function computeMajorOp (before, after) {
  if (before.oid === after.oid) return []
  // Note: here we ignore our handy `.exists` and just coerce `.type` to undefined lol
  switch (`${before.type}-${after.type}`) {
    case 'blob-blob':
      return ['write']
    case 'tree-tree':
      return []
    case 'blob-tree':
      return ['rm', 'mkdir']
    case 'tree-blob':
      return ['rmdir', 'write']
    case 'undefined-blob':
      return ['write']
    case 'undefined-tree':
      return ['mkdir']
    case 'blob-undefined':
      return ['rm']
    case 'tree-undefined':
      return ['rmdir']
  }
  console.log(before, after)
}
