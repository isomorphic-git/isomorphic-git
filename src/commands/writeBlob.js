// @ts-check
import { writeObject } from '../storage/writeObject.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {Uint8Array} args.blob
 *
 * @returns {Promise<string>}
 *
 */
export async function writeBlob ({
  fs,
  gitdir,
  blob
}) {
  const oid = await writeObject({
    fs,
    gitdir,
    type: 'blob',
    object: blob,
    format: 'content'
  })
  return oid
}
