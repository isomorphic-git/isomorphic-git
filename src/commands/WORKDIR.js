// @ts-check
import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a working directory `Walker`
 *
 * See [walk](./walk.md)
 *
 * @returns {Walker} Returns a working directory Walker
 *
 */
export function WORKDIR () {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function ({ fs, dir, gitdir }) {
      return new GitWalkerFs({ fs, dir, gitdir })
    }
  })
  Object.freeze(o)
  return o
}
