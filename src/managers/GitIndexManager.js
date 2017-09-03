//@flow
import LockManager from 'travix-lock-manager'
import debounce from 'lodash.debounce'
import read from '../utils/read'
import GitIndex from '../models/GitIndex'
import Lock from '../utils/lockfile'

// TODO: replace with an LRU cache?
const map /*: Map<string, GitIndex> */ = new Map()
const lm = new LockManager()

export default class {
  static async acquire (filepath) {
    await lm.acquire(filepath)
    if (!map.has(filepath)) {
      // Acquire a file lock while we're reading the index
      // to make sure other processes aren't writing to it
      // simultaneously, which could result in a corrupted index.
      const fileLock = await Lock(filepath)
      const rawIndexFile = await read(filepath)
      let index = GitIndex.from(rawIndexFile)
      // cache the GitIndex object so we don't need to re-read it
      // every time.
      // TODO: save the stat data for the index so we know whether
      // the cached file is stale (modified by an outside process).
      map.set(filepath, index)
      await fileLock.cancel()
    }
    return map.get(filepath)
  }
  static async release (filepath) {
    const index = map.get(filepath)
    if (index && index._dirty) {
      // Acquire a file lock while we're writing the index file
      let fileLock = await Lock(filepath)
      const buffer = index.toObject()
      await fileLock.update(buffer)
      index._dirty = false
    }
    lm.release(filepath)
  }
}