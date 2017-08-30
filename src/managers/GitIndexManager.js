//@flow
import LockManager from 'travix-lock-manager'
import read from '../utils/read'
import GitIndex from '../models/GitIndex'

// TODO: replace with an LRU cache?
const map = new Map()
const lm = new LockManager()

export default class {
  static async acquire (filepath) {
    await lm.acquire(filepath)
    if (!map.has(filepath)) {
      const rawIndexFile = await read(filepath)
      console.log('***********')
      console.log(rawIndexFile)
      map.set(filepath, GitIndex.from(rawIndexFile))
    }
    return map.get(filepath)
  }
  static async release (filepath) {
    lm.release(filepath)
  }
}