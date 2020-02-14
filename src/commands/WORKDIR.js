// @ts-check
import '../typedefs.js'

import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 * @returns {Walker}
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
