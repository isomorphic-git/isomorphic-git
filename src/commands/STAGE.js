// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitWalkerIndex } from '../models/GitWalkerIndex.js'
import { GitWalkerIndex2 } from '../models/GitWalkerIndex2.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitWalkBeta1Symbol, GitWalkBeta2Symbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a git index Walker
 *
 * See [walkBeta2](./walkBeta2.md)
 *
 * @returns {Walker} Returns a git index Walker
 *
 */
export function STAGE ({
  core = 'default',
  // @ts-ignore
  dir,
  // @ts-ignore
  gitdir,
  // @ts-ignore
  fs: _fs
} = {}) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkBeta1Symbol, {
    value: function () {
      gitdir = gitdir || join(dir, '.git')
      _fs = cores.get(core).get('fs')
      const fs = new FileSystem(_fs)
      return new GitWalkerIndex({ fs, gitdir })
    }
  })
  Object.defineProperty(o, GitWalkBeta2Symbol, {
    value: function ({ fs, gitdir }) {
      return new GitWalkerIndex2({ fs, gitdir })
    }
  })
  Object.freeze(o)
  return o
}
