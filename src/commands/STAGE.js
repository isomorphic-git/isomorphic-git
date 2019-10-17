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
 * See [walkBeta1](./walkBeta1.md)
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Walker} Returns a git index Walker
 *
 */
export function STAGE ({ core = 'default', dir, gitdir, fs: _fs } = {}) {
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
