import { _readObject } from '../storage/readObject.js'

import { hasCrlf } from './convertCrlfToLf.js'

/**
 * Tell whether the blob the index holds for a path is text with CRLF line
 * endings, like `has_crlf_in_index` in git's convert.c.
 *
 * With `core.autocrlf` canonical git leaves such a file alone: converting it
 * would make a file that was committed with CRLF show as modified forever.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {object} [args.entry] - the index entry of the path, if it has one
 * @returns {Promise<boolean>}
 */
export async function hasCrlfInIndex({ fs, cache, gitdir, entry }) {
  // For an unmerged path git looks at "our" side
  if (entry && entry.flags.stage !== 0) entry = entry.stages[2]
  if (!entry) return false
  try {
    const { type, object } = await _readObject({
      fs,
      cache,
      gitdir,
      oid: entry.oid,
    })
    return type === 'blob' && hasCrlf(object)
  } catch (err) {
    // git treats a blob it cannot read as having no CRLF
    return false
  }
}
