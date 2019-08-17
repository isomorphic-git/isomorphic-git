// @ts-check
import { GitError, E } from '../models/GitError.js'
import { flat } from '../utils/flat.js'
import { TREEPATCH } from './TREEPATCH.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 *
 * @typedef {import('./diffTree').TreePatch} TreePatch
 */

/**
 * Combine multiple `TreePatch`es into one, or throw an error if there is a conflict.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {TreePatch[]} args.treePatches - The SHA-1 object id of the first commit
 * @param {string} args.after - The SHA-1 object id of the second commit
 *
 * @returns {Promise<TreePatch>} The name of the current branch or undefined if the HEAD is detached.
 * @see TreePatch
 *
 * @example
 * // Get the current branch name
 * let branch = await git.mergeTreePatches({ dir: '$input((/))', treePatches: $input(([])) })
 * console.log(branch)
 *
 */
export async function mergeTreePatches ({
  treePatches,
}) {
  try {
    const collisions = []
    const results = await walkBeta1({
      trees: treePatches.map(patch => TREEPATCH({ patch })),
      map: async (entries) => {
        // label entries
        entries.forEach((entry, index) => entry.index = index)
        // Only one change can happen per filepath
        const ops = entries.filter(entry => entry.ops && entry.ops.length > 0)
        if (ops.length === 0) {
          return entryToPatch(entries[0])
        } else if (ops.length === 1) {
          return entryToPatch(ops[0])
        } else {
          return {
            ops: [],
            conflicts: ops.map(entryToPatch)
          }
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
          try {
          const subOps = children.filter(child => child.ops.length > 0 || child.subOps && child.subOps.length > 0) // remove undefineds
          if (subOps.length > 0) parent.subOps = subOps
          return parent
          } catch (e) {
            console.log(children)
          }
        }
      }
    })
    return results
  } catch (err) {
    err.caller = 'git.mergeTreePatches'
    throw err
  }
}

function entryToPatch (entry) {
  const { after, before, basename, ops, subOps } = entry
  // this is kind of silly... why am I trying to avoid undefineds? aesthetics?
  const patch = {}
  if (after) patch.after = after
  if (before) patch.before = before
  patch.basename = basename
  patch.ops = ops || []
  if (subOps) patch.subOps = subOps
  patch.index = entry.index
  return patch
}
