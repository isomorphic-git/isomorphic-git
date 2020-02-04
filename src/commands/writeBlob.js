// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'

/**
 * Write a blob object directly
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {Uint8Array} args.blob - The blob object to write
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly written object
 *
 * @example
 * // Manually create a blob.
 * let oid = await git.writeBlob({
 *   dir: '$input((/))',
 *   blob: $input((new Uint8Array([])))
 * })
 *
 * console.log('oid', oid) // should be 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'
 *
 */
export async function writeBlob ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  blob
}) {
  try {
    const fs = new FileSystem(_fs)
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'blob',
      object: blob,
      format: 'content'
    })
    return oid
  } catch (err) {
    err.caller = 'git.writeBlob'
    throw err
  }
}
