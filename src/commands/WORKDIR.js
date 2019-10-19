// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkerFs2 } from '../models/GitWalkerFs2.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitWalkBeta1Symbol, GitWalkBeta2Symbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a working directory `Walker`
 *
 * See [walkBeta2](./walkBeta2.md)
 *
 * @returns {Walker} Returns a working directory Walker
 *
 */
export function WORKDIR ({
  // @ts-ignore
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
      return new GitWalkerFs({ fs, dir, gitdir })
    }
  })
  Object.defineProperty(o, GitWalkBeta2Symbol, {
    value: function ({ fs, dir, gitdir }) {
      return new GitWalkerFs2({ fs, dir, gitdir })
    }
  })
  Object.freeze(o)
  return o
}
