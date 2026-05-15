// @ts-check
import '../typedefs.js'

import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkSymbol } from '../utils/symbols.js'

/**
 * @param {object} [opts]
 * @param {boolean} [opts.refresh=true] - When false, suppress the stat-cache
 *   refresh that would rewrite `.git/index` when a working-tree file's stat
 *   info has drifted but its content still matches the staged blob.
 * @returns {Walker}
 */
export function WORKDIR({ refresh = true } = {}) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkSymbol, {
    value: function ({ fs, dir, gitdir, cache }) {
      return new GitWalkerFs({ fs, dir, gitdir, cache, refresh })
    },
  })
  Object.freeze(o)
  return o
}
