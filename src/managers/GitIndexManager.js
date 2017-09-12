// @flow
// import LockManager from 'travix-lock-manager'
import read from '../utils/read'
import write from '../utils/write'
import GitIndex from '../models/GitIndex'
import AsyncLock from 'async-lock'
// import Lock from '../utils/lockfile'

// TODO: replace with an LRU cache?
const map /*: Map<string, GitIndex> */ = new Map()
// const lm = new LockManager()
const lock = new AsyncLock()

export default class GitIndexManager {
  static async acquire (filepath, closure) {
    await lock.acquire(filepath, async function () {
      let index = map.get(filepath)
      if (index === undefined) {
        // Acquire a file lock while we're reading the index
        // to make sure other processes aren't writing to it
        // simultaneously, which could result in a corrupted index.
        // const fileLock = await Lock(filepath)
        const rawIndexFile = await read(filepath)
        index = GitIndex.from(rawIndexFile)
        // cache the GitIndex object so we don't need to re-read it
        // every time.
        // TODO: save the stat data for the index so we know whether
        // the cached file is stale (modified by an outside process).
        map.set(filepath, index)
        // await fileLock.cancel()
      }
      await closure(index)
      if (index._dirty) {
        // Acquire a file lock while we're writing the index file
        // let fileLock = await Lock(filepath)
        const buffer = index.toObject()
        await write(filepath, buffer)
        index._dirty = false
      }
    })
  }
}
