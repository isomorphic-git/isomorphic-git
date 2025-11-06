import '../typedefs.js'

// import LockManager from 'travix-lock-manager'
import AsyncLock from 'async-lock'

import { UnmergedPathsError } from '../errors/UnmergedPathsError.js'
import { GitIndex } from '../models/GitIndex.js'
import { compareStats } from '../utils/compareStats.js'

// import Lock from '../utils.js'

// const lm = new LockManager()
let lock = null

const IndexCache = Symbol('IndexCache')

/**
 * Creates a cache object to store GitIndex and file stats.
 * @returns {object} A cache object with `map` and `stats` properties.
 */
function createCache() {
  return {
    map: new Map(),
    stats: new Map(),
  }
}

/**
 * Updates the cached index file by reading the file system and parsing the Git index.
 * @param {FSClient} fs - A file system implementation.
 * @param {string} filepath - The path to the Git index file.
 * @param {object} cache - The cache object to update.
 * @returns {Promise<void>}
 */
async function updateCachedIndexFile(fs, filepath, cache) {
  const [stat, rawIndexFile] = await Promise.all([
    fs.lstat(filepath),
    fs.read(filepath),
  ])

  const index = await GitIndex.from(rawIndexFile)
  // cache the GitIndex object so we don't need to re-read it every time.
  cache.map.set(filepath, index)
  // Save the stat data for the index so we know whether the cached file is stale (modified by an outside process).
  cache.stats.set(filepath, stat)
}

/**
 * Determines whether the cached index file is stale by comparing file stats.
 * @param {FSClient} fs - A file system implementation.
 * @param {string} filepath - The path to the Git index file.
 * @param {object} cache - The cache object containing file stats.
 * @returns {Promise<boolean>} `true` if the index file is stale, otherwise `false`.
 */
async function isIndexStale(fs, filepath, cache) {
  const savedStats = cache.stats.get(filepath)
  if (savedStats === undefined) return true
  if (savedStats === null) return false

  const currStats = await fs.lstat(filepath)
  if (currStats === null) return false
  return compareStats(savedStats, currStats)
}

export class GitIndexManager {
  /**
   * Manages access to the Git index file, ensuring thread-safe operations and caching.
   *
   * @param {object} opts - Options for acquiring the Git index.
   * @param {FSClient} opts.fs - A file system implementation.
   * @param {string} opts.gitdir - The path to the `.git` directory.
   * @param {object} opts.cache - A shared cache object for storing index data.
   * @param {boolean} [opts.allowUnmerged=true] - Whether to allow unmerged paths in the index.
   * @param {function(GitIndex): any} closure - A function to execute with the Git index.
   * @returns {Promise<any>} The result of the closure function.
   * @throws {UnmergedPathsError} If unmerged paths exist and `allowUnmerged` is `false`.
   */
  static async acquire({ fs, gitdir, cache, allowUnmerged = true }, closure) {
    if (!cache[IndexCache]) {
      cache[IndexCache] = createCache()
    }

    const filepath = `${gitdir}/index`
    if (lock === null) lock = new AsyncLock({ maxPending: Infinity })
    let result
    let unmergedPaths = []
    await lock.acquire(filepath, async () => {
      // Acquire a file lock while we're reading the index
      // to make sure other processes aren't writing to it
      // simultaneously, which could result in a corrupted index.
      // const fileLock = await Lock(filepath)
      const theIndexCache = cache[IndexCache]
      if (await isIndexStale(fs, filepath, theIndexCache)) {
        await updateCachedIndexFile(fs, filepath, theIndexCache)
      }
      const index = theIndexCache.map.get(filepath)
      unmergedPaths = index.unmergedPaths

      if (unmergedPaths.length && !allowUnmerged)
        throw new UnmergedPathsError(unmergedPaths)

      result = await closure(index)
      if (index._dirty) {
        // Acquire a file lock while we're writing the index file
        // let fileLock = await Lock(filepath)
        const buffer = await index.toObject()
        await fs.write(filepath, buffer)
        // Update cached stat value
        theIndexCache.stats.set(filepath, await fs.lstat(filepath))
        index._dirty = false
      }
    })

    return result
  }
}
