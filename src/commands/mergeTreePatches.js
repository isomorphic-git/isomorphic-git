// @ts-check
import { GitError, E } from '../models/GitError.js'
import { flat } from '../utils/flat.js'

/**
 *
 * @typedef {import('./diffTree').TreePatch[]} TreePatchset
 */

/**
 * Combine multiple TreePatchsets and throw an error if there is a conflict.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {Array<TreePatchset>} args.patchsets - The SHA-1 object id of the first commit
 * @param {string} args.after - The SHA-1 object id of the second commit
 *
 * @returns {Promise<TreePatchset>} The name of the current branch or undefined if the HEAD is detached.
 * @see TreePatch
 *
 * @example
 * // Get the current branch name
 * let branch = await git.mergeTreePatches({ dir: '$input((/))', patchsets: $input(([])) })
 * console.log(branch)
 *
 */
export async function mergeTreePatches ({
  patchsets,
}) {
  try {
    const collider = new Map()
    const collisions = []

    for (const patchset of patchsets) {
      for (const patch of patchset) {
        if (collider.has(patch.filepath)) {
          collisions.push([
            collider.get(patch.filepath),
            patch
          ])
        } else {
          collider.set(patch.filepath, patch)
        }
      }
    }

    if (collisions.length > 0) {
      throw new GitError(E.MergeConflict, { collisions })
    }

    return flat(patchsets)
  } catch (err) {
    err.caller = 'git.mergeTreePatches'
    throw err
  }
}
