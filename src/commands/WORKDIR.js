// @ts-check
import 'typedefs'

import { GitWalkerFs } from 'models/GitWalkerFs'
import { GitWalkSymbol } from 'utils/symbols'

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
