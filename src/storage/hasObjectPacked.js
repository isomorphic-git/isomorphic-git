import { InternalError } from '../errors/InternalError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'

export async function hasObjectPacked(args) {
  return (await findPackWithObject(args)) !== null
}

/**
 * Find the pack index that holds an object.
 *
 * @param {object} args
 * @param {any} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @param {function} [args.getExternalRefDelta]
 * @param {string[]|Promise<string[]>} [args.idxNames] - The `.idx` names to search. Default: list `objects/pack` now.
 * @returns {Promise<string|null>} The `.idx` file name, or null if no pack holds the object.
 */
export async function findPackWithObject({
  fs,
  cache,
  gitdir,
  oid,
  getExternalRefDelta,
  idxNames,
}) {
  // Check to see if it's in a packfile.
  // Iterate through all the .idx files
  const list = await (idxNames || listIdxNames({ fs, gitdir }))
  for (const filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`
    const p = await readPackIndex({
      fs,
      cache,
      filename: indexFile,
      getExternalRefDelta,
    })
    if (p.error) throw new InternalError(p.error)
    // If the packfile DOES have the oid we're looking for...
    if (p.offsets.has(oid)) {
      return filename
    }
  }
  // Failed to find it
  return null
}

/**
 * List the `.idx` file names in `gitdir/objects/pack`.
 *
 * @param {object} args
 * @param {any} args.fs
 * @param {string} args.gitdir
 * @returns {Promise<string[]>} The names, or `[]` if `objects/pack` is missing or is not a folder.
 */
export async function listIdxNames({ fs, gitdir }) {
  const names = await fs.readdir(join(gitdir, 'objects/pack'))
  return (names || []).filter(x => x.endsWith('.idx'))
}
