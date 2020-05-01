// @ts-check
import 'typedefs'

import { GitWalkerRepo } from 'models/GitWalkerRepo'
import { GitWalkSymbol } from 'utils/symbols'

/**
 * @param {object} args
 * @param {string} [args.ref='HEAD']
 * @returns {Walker}
 */
export function TREE({ ref = 'HEAD' }) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, gitdir }) {
      return new GitWalkerRepo({ fs, gitdir, ref })
    },
  })
  Object.freeze(o)
  return o
}
