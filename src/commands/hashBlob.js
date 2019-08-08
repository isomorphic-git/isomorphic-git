// @ts-check
import { hashObject } from '../storage/hashObject.js'

/**
 *
 * @typedef {object} HashBlobResult - The object returned has the following schema:
 * @property {string} oid - The SHA-1 object id
 * @property {'blob'} type - The type of the object
 * @property {Buffer} object - The wrapped git object (the thing that is hashed)
 * @property {'wrapped'} format - The format of the object
 *
 */

/**
 * Compute what the SHA-1 object id of a file would be
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {Buffer|string} args.object - The object to write. If `object` is a String then it will be converted to a Buffer using UTF-8 encoding.
 *
 * @returns {Promise<{HashBlobResult}>} Resolves successfully with the SHA-1 object id and the wrapped object Buffer.
 * @see HashBlobResult
 *
 * @example
 * let { oid, type, object, format } = await git.hashBlob({
 *   object: '$input((Hello world!))',
 * })
 *
 * console.log('oid', oid)
 * console.log('type', type)
 * console.log('object', object)
 * console.log('format', format)
 *
 */
export async function hashBlob ({ core = 'default', object }) {
  try {
    // Convert object to buffer
    if (typeof object === 'string') {
      object = Buffer.from(object, 'utf8')
    }

    const type = 'blob'
    const { oid, object: _object } = await hashObject({
      type: 'blob',
      format: 'content',
      object
    })
    return { oid, type, object: _object, format: 'wrapped' }
  } catch (err) {
    err.caller = 'git.hashBlob'
    throw err
  }
}
