// @ts-check
import { GitWalkerPatch } from '../models/GitWalkerPatch.js'
import { GitWalkerSymbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a TreePatch commit Walker
 *
 * See [walkBeta1](./walkBeta1.md)
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {import('./_mergeTreePatches.js').TreePatch} args.patch - [required] The patch to walk
 *
 * @returns {Walker} Returns a git commit Walker
 *
 */
export function _TREEPATCH ({ core = 'default', patch }) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkerSymbol, {
    value: function () {
      return new GitWalkerPatch({ patch })
    }
  })
  Object.freeze(o)
  return o
}
