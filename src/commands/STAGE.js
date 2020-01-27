// @ts-check
import { GitWalkerIndex } from '../models/GitWalkerIndex.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a git index Walker
 *
 * See [walk](./walk.md)
 *
 * @returns {Walker} Returns a git index `Walker`
 *
 */
export function STAGE () {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function ({ fs, gitdir }) {
      return new GitWalkerIndex({ fs, gitdir })
    }
  })
  Object.freeze(o)
  return o
}
