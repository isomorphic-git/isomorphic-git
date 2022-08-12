// @ts-check
import '../typedefs.js'

import { GitWalkerRepo } from '../models/GitWalkerRepo.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 * @param {object} args
 * @param {string} [args.ref='HEAD']
 * @returns {Walker}
 */
export function TREE({ ref = 'HEAD' } = {}) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function({ fs, gitdir, cache }) {
      return new GitWalkerRepo({ fs, gitdir, ref, cache })
    },
  })
  Object.freeze(o)
  return o
}
