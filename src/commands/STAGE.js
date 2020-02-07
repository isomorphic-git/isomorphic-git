// @ts-check
import '../commands/typedefs.js'

import { GitWalkerIndex } from '../models/GitWalkerIndex.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 * @returns {Walker}
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
