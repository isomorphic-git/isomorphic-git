// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitWalkerRepo } from '../models/GitWalkerRepo.js'
import { GitWalkerRepo2 } from '../models/GitWalkerRepo2.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'
import { GitWalkBeta1Symbol, GitWalkBeta2Symbol } from '../utils/symbols.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 * Get a git commit `Walker`
 *
 * See [walkBeta2](./walkBeta2.md)
 *
 * @param {object} args
 * @param {string} [args.ref='HEAD'] - The commit to walk
 *
 * @returns {Walker} Returns a git commit Walker
 *
 */
export function TREE ({
  ref = 'HEAD',
  // @ts-ignore
  core = 'default',
  // @ts-ignore
  dir,
  // @ts-ignore
  gitdir,
  // @ts-ignore
  fs: _fs
}) {
  const o = Object.create(null)
  Object.defineProperty(o, GitWalkBeta1Symbol, {
    value: function () {
      gitdir = gitdir || join(dir, '.git')
      _fs = cores.get(core).get('fs')
      const fs = new FileSystem(_fs)
      return new GitWalkerRepo({ fs, gitdir, ref })
    }
  })
  Object.defineProperty(o, GitWalkBeta2Symbol, {
    value: function ({ fs, gitdir }) {
      return new GitWalkerRepo2({ fs, gitdir, ref })
    }
  })
  Object.freeze(o)
  return o
}
