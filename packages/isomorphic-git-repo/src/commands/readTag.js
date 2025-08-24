// @ts-check
import '../typedefs.js'

import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { _readObject as readObject } from '../storage/readObject.js'

/**
 *
 * @typedef {Object} ReadTagResult - The object returned has the following schema:
 * @property {string} oid - SHA-1 object id of this tag
 * @property {TagObject} tag - the parsed tag object
 * @property {string} payload - PGP signing payload
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadTagResult>}
 */
export async function _readTag({ fs, cache, gitdir, oid }) {
  const { type, object } = await readObject({
    fs,
    cache,
    gitdir,
    oid,
    format: 'content',
  })
  if (type !== 'tag') {
    throw new ObjectTypeError(oid, type, 'tag')
  }
  const tag = GitAnnotatedTag.from(object)
  const result = {
    oid,
    tag: tag.parse(),
    payload: tag.payload(),
  }
  // @ts-ignore
  return result
}
