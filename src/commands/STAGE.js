// @ts-check
import 'typedefs'

import { GitWalkerIndex } from 'models/GitWalkerIndex'
import { GitWalkSymbol } from 'utils/symbols'

/**
 * @returns {Walker}
 */
export function STAGE() {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, gitdir, cache }) {
      return new GitWalkerIndex({ fs, gitdir, cache })
    },
  })
  Object.freeze(o)
  return o
}
