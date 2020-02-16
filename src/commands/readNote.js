// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'

import { readBlob } from './readBlob'

/**
 * Read the contents of a note
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} [args.ref] - The notes ref to look under
 * @param {string} args.oid
 *
 * @returns {Promise<Uint8Array>} Resolves successfully with note contents as a Buffer.
 */

export async function readNote({
  fs,
  gitdir,
  ref = 'refs/notes/commits',
  oid,
}) {
  const parent = await GitRefManager.resolve({ gitdir, fs, ref })
  const { blob } = await readBlob({
    fs,
    gitdir,
    oid: parent,
    filepath: oid,
  })

  return blob
}
