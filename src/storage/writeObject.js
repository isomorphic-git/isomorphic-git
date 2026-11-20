import { GitObject } from '../models/GitObject.js'
import { findPackWithObject, listIdxNames } from '../storage/hasObjectPacked.js'
import { _readObject } from '../storage/readObject.js'
import { writeObjectLoose } from '../storage/writeObjectLoose.js'
import { deflate } from '../utils/deflate.js'
import { shasum } from '../utils/shasum.js'

const PackListCache = Symbol('PackListCache')

/**
 * Write an object as a loose file.
 *
 * @param {object} args
 * @param {any} args.fs
 * @param {any} [args.cache] - When given, skip the write if a pack file in `gitdir` already holds the object. Without it, the object is always written loose.
 * @param {string} args.gitdir
 * @param {string} [args.type]
 * @param {Buffer|Uint8Array} args.object
 * @param {'content'|'wrapped'|'deflated'} [args.format = 'content']
 * @param {string} [args.oid] - Required when `format` is 'deflated'.
 * @param {boolean} [args.dryRun = false] - Compute the oid only. Write nothing.
 * @returns {Promise<string>} The oid, also when the write is skipped.
 */
export async function _writeObject({
  fs,
  cache,
  gitdir,
  type,
  object,
  format = 'content',
  oid = undefined,
  dryRun = false,
}) {
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object })
    }
    oid = await shasum(object)
  }
  if (dryRun) return oid
  if (cache && (await isPacked({ fs, cache, gitdir, oid }))) return oid
  if (format !== 'deflated') {
    object = Buffer.from(await deflate(object))
  }
  await writeObjectLoose({ fs, gitdir, object, format: 'deflated', oid })
  return oid
}

// The pack list lives as long as `cache`. A pack added later is missed, which
// costs only a redundant loose write. Read paths must not use this list.
// Any doubt means "not packed": a redundant loose write is always safe.
async function isPacked({ fs, cache, gitdir, oid }) {
  if (!cache[PackListCache]) cache[PackListCache] = new Map()
  const lists = cache[PackListCache]
  let idxNames = lists.get(gitdir)
  if (!idxNames) {
    idxNames = listIdxNames({ fs, gitdir })
    lists.set(gitdir, idxNames)
  }
  try {
    // Same resolver as the read path, because the first load of an index is shared.
    const getExternalRefDelta = oid => _readObject({ fs, cache, gitdir, oid })
    const idx = await findPackWithObject({
      fs,
      cache,
      gitdir,
      oid,
      getExternalRefDelta,
      idxNames,
    })
    if (idx === null) return false
    // The cached index outlives its pack if an external `git gc` deletes it.
    const pack = `${gitdir}/objects/pack/${idx.replace(/idx$/, 'pack')}`
    if (await fs.exists(pack)) return true
  } catch (err) {
    // A missing, unreadable or unsupported .idx: write the object loose.
  }
  // The list is stale or broken: list the folder again next time.
  if (lists.get(gitdir) === idxNames) lists.delete(gitdir)
  return false
}
