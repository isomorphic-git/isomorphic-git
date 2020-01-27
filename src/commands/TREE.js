// @ts-check
import { GitWalkerRepo } from '../models/GitWalkerRepo.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a git commit `Walker`
 *
 * See [walk](./walk.md)
 *
 * @param {object} args
 * @param {string} [args.ref='HEAD'] - The commit to walk
 *
 * @returns {Walker} Returns a git commit Walker
 *
 */
export function TREE ({
  ref = 'HEAD'
}) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function ({ fs, gitdir }) {
      return new GitWalkerRepo({ fs, gitdir, ref })
    }
  })
  Object.freeze(o)
  return o
}
