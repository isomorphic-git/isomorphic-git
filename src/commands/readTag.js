// @ts-check
import '../commands/typedefs.js'

import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'

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
 * @param {string} args.gitdir
 * @param {string} args.oid
 *
 * @returns {Promise<ReadTagResult>}
 */
export async function readTag ({ fs, gitdir, oid }) {
  const { type, object } = await readObject({
    fs,
    gitdir,
    oid,
    format: 'content'
  })
  if (type !== 'tag') {
    throw new GitError(E.ObjectTypeAssertionFail, {
      oid,
      type,
      expected: 'tag'
    })
  }
  const tag = GitAnnotatedTag.from(object)
  const result = {
    oid,
    tag: tag.parse(),
    payload: tag.payload()
  }
  // @ts-ignore
  return result
}
