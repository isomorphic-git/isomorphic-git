// @ts-check
import { hashObject } from '../storage/hashObject.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 *
 * @typedef {object} HashBlobResult - The object returned has the following schema:
 * @property {string} oid - The SHA-1 object id
 * @property {'blob'} type - The type of the object
 * @property {Uint8Array} object - The wrapped git object (the thing that is hashed)
 * @property {'wrapped'} format - The format of the object
 *
 */

/**
 * Compute what the SHA-1 object id of a file would be
 *
 * @param {object} args
 * @param {Uint8Array|string} args.object - The object to write. If `object` is a String then it will be converted to a Uint8Array using UTF-8 encoding.
 *
 * @returns {Promise<HashBlobResult>} Resolves successfully with the SHA-1 object id and the wrapped object Uint8Array.
 * @see HashBlobResult
 *
 * @example
 * let { oid, type, object, format } = await git.hashBlob({
 *   object: 'Hello world!',
 * })
 *
 * console.log('oid', oid)
 * console.log('type', type)
 * console.log('object', object)
 * console.log('format', format)
 *
 */
export async function hashBlob({ object }) {
  try {
    assertParameter('object', object)

    // Convert object to buffer
    if (typeof object === 'string') {
      object = Buffer.from(object, 'utf8')
    } else {
      object = Buffer.from(object)
    }

    const type = 'blob'
    const { oid, object: _object } = await hashObject({
      type: 'blob',
      format: 'content',
      object,
    })
    return { oid, type, object: new Uint8Array(_object), format: 'wrapped' }
  } catch (err) {
    err.caller = 'git.hashBlob'
    throw err
  }
}
