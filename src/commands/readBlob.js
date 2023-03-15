// @ts-check
import { resolveBlob } from '../utils/resolveBlob.js'
import { resolveFilepath } from '../utils/resolveFilepath.js'

/**
 *
 * @typedef {Object} ReadBlobResult - The object returned has the following schema:
 * @property {string} oid
 * @property {Uint8Array} blob
 *
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {string} [args.filepath]
 *
 * @returns {Promise<ReadBlobResult>} Resolves successfully with a blob object description
 * @see ReadBlobResult
 */
export async function _readBlob({
  fs,
  cache,
  gitdir,
  oid,
  filepath = undefined,
}) {
  if (filepath !== undefined) {
    oid = await resolveFilepath({ fs, cache, gitdir, oid, filepath })
  }
  const blob = await resolveBlob({
    fs,
    cache,
    gitdir,
    oid,
  })
  return blob
}
