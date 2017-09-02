//@flow
import LockManager from 'travix-lock-manager'
import debounce from 'lodash.debounce'
import read from '../utils/read'
import GitIndex from '../models/GitIndex'
import Lock from '../utils/lockfile'

// TODO: replace with an LRU cache?
const map = new Map()
const lm = new LockManager()

export default class {
  static async acquire (filepath) {
    await lm.acquire(filepath)
    if (!map.has(filepath)) {
      let lockfile = await Lock(filepath)
      const rawIndexFile = await read(filepath)
      console.log('***********')
      console.log(rawIndexFile)
      let index = GitIndex.from(rawIndexFile)
      map.set(filepath, {index, lockfile})
    }
    const {index} = map.get(filepath)
    return index
  }
  static async release (filepath) {
    const {index, lockfile} = map.get(filepath)
    if (index._dirty) {
      const buffer = index.toObject()
      console.log('updating', lockfile)
      await lockfile.update(buffer)
    } else {
      console.log('canceling')
      await lockfile.cancel()
    }
    console.log('RELEASE', lockfile._filename, index._dirty)
    lm.release(filepath)
  }
}