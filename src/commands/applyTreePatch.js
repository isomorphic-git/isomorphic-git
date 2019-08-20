// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitTree } from '../models/GitTree.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { TREE } from './TREE.js'
import { TREEPATCH } from './TREEPATCH.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 *
 * @typedef {import('./diffTree').TreePatch} TreePatch
 */

/**
 *
 * @typedef {import('./readObject').TreeEntry} TreeEntry
 */

/**
 * Apply a single `TreePatch` to a tree and return a tree
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.base - THS SHA-1 object id of the base tree
 * @param {TreePatch} args.treePatch - A tree patch object
 *
 * @returns {Promise<string>} The SHA-1 object id of the new tree
 * @see TreePatch
 *
 * @example
 * // Get the current branch name
 * let branch = await git.applyTreePatch({ dir: '$input((/))', treePatches: $input(([])) })
 * console.log(branch)
 *
 */
export async function applyTreePatch ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  base,
  treePatch
}) {
  try {
    const fs = new FileSystem(_fs)
    const tree = TREE({ core, dir, gitdir, fs, ref: base })
    const patch = TREEPATCH({ patch: treePatch })

    const results = await walkBeta1({
      trees: [tree, patch],

      map: async ([repo, patch]) => {
        // label entries
        await Promise.all([
          repo.populateStat(),
          patch.populateStat(),
          repo.populateHash(),
          repo.populateHash()
        ])
        // handle deletions
        if (patch.exists && patch.ops) {
          if (patch.ops.includes('rm') && !patch.ops.includes('mkdir')) {
            return
          }
          if (patch.ops.includes('rmdir') && !patch.ops.includes('write')) {
            return
          }
        }
        const entry = {
          path: repo.basename,
          mode: void 0,
          oid: void 0,
          type: void 0
        }
        if (repo.exists) {
          entry.mode = repo.mode
          entry.oid = repo.oid
          entry.type = repo.type
        }
        // handle changes
        if (patch.exists && patch.ops) {
          if (patch.ops.includes('write')) {
            entry.type = 'blob'
            entry.oid = patch.after
            if (repo.exists) {
              entry.mode = repo.mode
            } else {
              entry.mode = '100655'
            }
          }
          if (patch.ops.includes('chmod+x')) {
            entry.mode = '100755'
          } else if (patch.ops.includes('chmod-x')) {
            entry.mode = '100655'
          }
          if (patch.ops.includes('mkdir')) {
            entry.type = 'tree'
            entry.mode = '040000'
          }
        }
        return entry
      },
      /**
       * @param {TreeEntry} [parent]
       * @param {Array<TreeEntry>} children
       */
      reduce: async (parent, children) => {
        const entries = children.filter(Boolean) // remove undefineds

        // automatically delete directories if they have been emptied
        if (parent && parent.type === 'tree' && entries.length === 0) return

        if (entries.length > 0) {
          const tree = new GitTree(entries)
          const object = tree.toObject()
          const oid = await writeObject({ fs, gitdir, type: 'tree', object })
          parent.oid = oid
        }
        return parent
      }
    })
    return results.oid
  } catch (err) {
    err.caller = 'git.applyTreePatch'
    throw err
  }
}
