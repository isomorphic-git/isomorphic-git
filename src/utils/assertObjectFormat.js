import { UnsupportedObjectFormatError } from '../errors/UnsupportedObjectFormatError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'

/**
 * Refuse a repository whose objects are not named by SHA-1.
 *
 * Canonical git records the hash function of a repository in `extensions.objectFormat`.
 * isomorphic-git only reads and writes SHA-1 objects, so operating on a SHA-256
 * repository would fail in confusing ways when reading, and corrupt it when writing.
 * A repository without the extension, or with it set to `sha1`, is unaffected.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @returns {Promise<void>}
 */
export async function assertObjectFormat({ fs, gitdir }) {
  const config = await GitConfigManager.get({ fs, gitdir })
  const objectFormat = await config.get('extensions.objectformat')
  if (objectFormat == null) return
  if (String(objectFormat).trim().toLowerCase() === 'sha1') return
  throw new UnsupportedObjectFormatError(String(objectFormat))
}
