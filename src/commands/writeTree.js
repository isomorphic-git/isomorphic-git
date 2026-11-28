// @ts-check
import '../typedefs.js'

import { GitTree } from '../models/GitTree.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} [args.cache] - a [cache](cache.md) object
 * @param {string} args.gitdir
 * @param {TreeObject} args.tree
 *
 * @returns {Promise<string>}
 */
export async function _writeTree({ fs, cache, gitdir, tree }) {
  // Convert object to buffer
  const object = GitTree.from(tree).toObject()
  const oid = await writeObject({
    fs,
    cache,
    gitdir,
    type: 'tree',
    object,
    format: 'content',
  })
  return oid
}
