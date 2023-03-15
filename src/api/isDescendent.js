// @ts-check
import '../typedefs.js'

import { _isDescendent } from '../commands/isDescendent.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Check whether a git commit is descended from another
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.oid - The descendent commit
 * @param {string} args.ancestor - The (proposed) ancestor commit
 * @param {number} [args.depth = -1] - Maximum depth to search before giving up. -1 means no maximum depth.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<boolean>} Resolves to true if `oid` is a descendent of `ancestor`
 *
 * @example
 * let oid = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
 * let ancestor = await git.resolveRef({ fs, dir: '/tutorial', ref: 'v0.20.0' })
 * console.log(oid, ancestor)
 * await git.isDescendent({ fs, dir: '/tutorial', oid, ancestor, depth: -1 })
 *
 */
export async function isDescendent({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oid,
  ancestor,
  depth = -1,
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oid', oid)
    assertParameter('ancestor', ancestor)

    return await _isDescendent({
      fs: new FileSystem(fs),
      cache,
      gitdir,
      oid,
      ancestor,
      depth,
    })
  } catch (err) {
    err.caller = 'git.isDescendent'
    throw err
  }
}
