// import LockManager from 'travix-lock-manager'
import AsyncLock from 'async-lock'

import { FileSystem } from '../models/FileSystem.js'
import { GitIndex } from '../models/GitIndex.js'

// import Lock from '../utils.js'

// TODO: replace with an LRU cache?
const map = new Map()
// const lm = new LockManager()
let lock = null

export class GitIndexManager {
  static async acquire ({ fs: _fs, filepath }, closure) {
    const fs = new FileSystem(_fs)
    if (lock === null) lock = new AsyncLock({ maxPending: Infinity })
    await lock.acquire(filepath, async function () {
      let index = map.get(filepath)
      if (index === undefined) {
        // Acquire a file lock while we're reading the index
        // to make sure other processes aren't writing to it
        // simultaneously, which could result in a corrupted index.
        // const fileLock = await Lock(filepath)
        const rawIndexFile = await fs.read(filepath)
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
        await fs.write(filepath, buffer)
        index._dirty = false
      }
      // For now, discard our cached object so that external index
      // manipulation is picked up. TODO: use lstat and compare
      // file times to determine if our cached object should be
      // discarded.
      map.delete(filepath)
    })
  }
}
