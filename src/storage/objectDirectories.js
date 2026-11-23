import { join } from '../utils/join.js'

const PackListCache = Symbol('PackListCache')
const LooseObjectCache = Symbol('LooseObjectCache')

// Keep `read` in `cache[symbol]` under `key`, unless `fresh` asks to read it again.
// A failed read is not kept.
function cached(cache, symbol, key, fresh, read) {
  if (!cache[symbol]) cache[symbol] = new Map()
  const map = cache[symbol]
  let p = map.get(key)
  if (!p || fresh) {
    p = read()
    map.set(key, p)
    p.catch(() => {
      if (map.get(key) === p) map.delete(key)
    })
  }
  return p
}

/**
 * The names of the pack indexes in `objects/pack`.
 *
 * The list is kept in the cache, so that each read of an object does not list the
 * directory again. It is out of date once a pack is added or removed: a caller
 * that does not find an object in the packs it lists asks again with `fresh`.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {boolean} [args.fresh = false] - List the directory again.
 * @returns {Promise<string[]>}
 */
export function readPackList({ fs, cache, gitdir, fresh = false }) {
  return cached(cache, PackListCache, gitdir, fresh, async () => {
    const list = await fs.readdir(join(gitdir, 'objects/pack'))
    return (list || []).filter(x => x.endsWith('.idx'))
  })
}

/**
 * Whether the loose object `oid` was in its directory of `objects` when the cache
 * listed that directory.
 *
 * Most objects of a repository are packed, so most reads of a loose object fail.
 * Listing each directory once, and keeping the list in the cache, saves a failed
 * read for each object. The list is out of date once an object is written: a
 * caller that does not find an object reads it again without asking.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string} args.oid
 * @returns {Promise<boolean>}
 */
export async function mayHaveLooseObject({ fs, cache, gitdir, oid }) {
  const dir = join(gitdir, 'objects', oid.slice(0, 2))
  const names = await cached(cache, LooseObjectCache, dir, false, async () => {
    return new Set((await fs.readdir(dir)) || [])
  })
  return names.has(oid.slice(2))
}
