// @ts-check
import '../typedefs.js'

import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { _writeObject as writeObject } from '../storage/writeObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {TagObject} args.tag
 *
 * @returns {Promise<string>}
 */
export async function _writeTag({ fs, gitdir, tag }) {
  // Convert object to buffer
  const object = GitAnnotatedTag.from(tag).toObject()
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'tag',
    object,
    format: 'content',
  })
  return oid
}
