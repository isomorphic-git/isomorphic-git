// @ts-check
import '../typedefs.js'

import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 * @returns {Walker}
 */
export function WORKDIR() {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, dir, gitdir, cache }) {
      return new GitWalkerFs({ fs, dir, gitdir, cache })
    },
  })
  Object.freeze(o)
  return o
}
