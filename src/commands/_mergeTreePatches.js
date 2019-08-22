// @ts-check
import { _TREEPATCH } from './_TREEPATCH.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 *
 * @typedef {import('./_diffTree').TreePatch} TreePatch
 */

/**
 * Combine multiple `TreePatch`es into one, or throw an error if there is a conflict.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {TreePatch[]} args.treePatches - The SHA-1 object id of the first commit
 *
 * @returns {Promise<{ treePatch: TreePatch, hasConflicts: boolean}>} The name of the current branch or undefined if the HEAD is detached.
 * @see TreePatch
 *
 */
export async function _mergeTreePatches ({ treePatches }) {
  try {
    let hasConflicts = false
    const treePatch = await walkBeta1({
      trees: treePatches.map(patch => _TREEPATCH({ patch })),
      map: async entries => {
        // label entries
        entries.forEach((entry, index) => {
          entry.index = index
        })
        // Only one change can happen per filepath
        const ops = entries.filter(entry => entry.ops && entry.ops.length > 0)
        if (ops.length === 0) {
          return entryToPatch(entries[0])
        } else if (ops.length === 1) {
          return entryToPatch(ops[0])
        } else {
          hasConflicts = true
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
            const subOps = children.filter(
              child =>
                child.ops.length > 0 ||
                (child.subOps && child.subOps.length > 0)
            ) // remove undefineds
            if (subOps.length > 0) parent.subOps = subOps
            return parent
          } catch (e) {
            console.log(children)
          }
        }
      }
    })
    return { treePatch, hasConflicts }
  } catch (err) {
    err.caller = 'git._mergeTreePatches'
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
