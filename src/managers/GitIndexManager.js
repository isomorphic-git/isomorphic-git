// import LockManager from 'travix-lock-manager'
import AsyncLock from 'async-lock'

import { GitIndex } from '../models/GitIndex.js'
import { DeepMap } from '../utils/DeepMap.js'
import { compareStats } from '../utils/compareStats.js'

// import Lock from '../utils.js'

// TODO: replace with an LRU cache?
const map = new DeepMap()
const stats = new DeepMap()
// const lm = new LockManager()
let lock = null

async function updateCachedIndexFile (fs, filepath) {
  const stat = await fs.lstat(filepath)
  const rawIndexFile = await fs.read(filepath)
  const index = await GitIndex.from(rawIndexFile)
  // cache the GitIndex object so we don't need to re-read it
  // every time.
  map.set([fs, filepath], index)
  // Save the stat data for the index so we know whether
  // the cached file is stale (modified by an outside process).
  stats.set([fs, filepath], stat)
}

// Determine whether our copy of the index file is stale
async function isIndexStale (fs, filepath) {
  const savedStats = stats.get([fs, filepath])
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
   * @param {function(GitIndex): any} closure
   */
  static async acquire ({ fs, gitdir }, closure) {
    const filepath = `${gitdir}/index`
    if (lock === null) lock = new AsyncLock({ maxPending: Infinity })
    let result
    await lock.acquire(filepath, async function () {
      // Acquire a file lock while we're reading the index
      // to make sure other processes aren't writing to it
      // simultaneously, which could result in a corrupted index.
      // const fileLock = await Lock(filepath)
      if (await isIndexStale(fs, filepath)) {
        await updateCachedIndexFile(fs, filepath)
      }
      const index = map.get([fs, filepath])
      result = await closure(index)
      if (index._dirty) {
        // Acquire a file lock while we're writing the index file
        // let fileLock = await Lock(filepath)
        const buffer = await index.toObject()
        await fs.write(filepath, buffer)
        // Update cached stat value
        stats.set([fs, filepath], await fs.lstat(filepath))
        index._dirty = false
      }
    })
    return result
  }
}
