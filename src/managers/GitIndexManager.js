// import LockManager from 'travix-lock-manager'
import AsyncLock from 'async-lock'

import { UnmergedPathsError } from '../errors/UnmergedPathsError.js'
import { GitIndex } from '../models/GitIndex.js'
import { compareStats } from '../utils/compareStats.js'

// import Lock from '../utils.js'

// const lm = new LockManager()
let lock = null

const IndexCache = Symbol('IndexCache')

function createCache() {
  return {
    map: new Map(),
    stats: new Map(),
  }
}

async function updateCachedIndexFile(fs, filepath, cache) {
  const stat = await fs.lstat(filepath)
  const rawIndexFile = await fs.read(filepath)
  const index = await GitIndex.from(rawIndexFile)
  // cache the GitIndex object so we don't need to re-read it every time.
  cache.map.set(filepath, index)
  // Save the stat data for the index so we know whether the cached file is stale (modified by an outside process).
  cache.stats.set(filepath, stat)
}

// Determine whether our copy of the index file is stale
async function isIndexStale(fs, filepath, cache) {
  const savedStats = cache.stats.get(filepath)
  if (savedStats === undefined) return true
  const currStats = await fs.lstat(filepath)
  if (savedStats === null) return false
  if (currStats === null) return false
  return compareStats(savedStats, currStats)
}

export class GitIndexManager {
  /**
   *
   * @param {object} opts
   * @param {import('../models/FileSystem.js').FileSystem} opts.fs
   * @param {string} opts.gitdir
   * @param {object} opts.cache
   * @param {bool} opts.allowUnmerged
   * @param {function(GitIndex): any} closure
   */
  static async acquire({ fs, gitdir, cache, allowUnmerged = true }, closure) {
    if (!cache[IndexCache]) cache[IndexCache] = createCache()

    const filepath = `${gitdir}/index`
    if (lock === null) lock = new AsyncLock({ maxPending: Infinity })
    let result
    let unmergedPaths = []
    await lock.acquire(filepath, async () => {
      // Acquire a file lock while we're reading the index
      // to make sure other processes aren't writing to it
      // simultaneously, which could result in a corrupted index.
      // const fileLock = await Lock(filepath)
      if (await isIndexStale(fs, filepath, cache[IndexCache])) {
        await updateCachedIndexFile(fs, filepath, cache[IndexCache])
      }
      const index = cache[IndexCache].map.get(filepath)
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
        cache[IndexCache].stats.set(filepath, await fs.lstat(filepath))
        index._dirty = false
      }
    })

    return result
  }
}
