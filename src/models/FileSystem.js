import path from 'path'
import pify from 'pify'
import { sleep } from '../utils'
const delayedReleases = new Map()
/**
 * @ignore
 * This is just a collection of helper functions really. At least that's how it started.
 */
export class FileSystem {
  constructor (fs) {
    if (typeof fs._readFile !== 'undefined') return fs
    this._readFile = pify(fs.readFile.bind(fs))
    this._writeFile = pify(fs.writeFile.bind(fs))
    this._mkdir = pify(fs.mkdir.bind(fs))
    this._rmdir = pify(fs.rmdir.bind(fs))
    this._unlink = pify(fs.unlink.bind(fs))
    this._stat = pify(fs.stat.bind(fs))
    this._lstat = pify(fs.lstat.bind(fs))
    this._readdir = pify(fs.readdir.bind(fs))
  }
  /**
   * Return true if a file exists, false if it doesn't exist.
   * Rethrows errors that aren't related to file existance.
   */
  async exists (filepath /*: string */, options /*: Object */ = {}) {
    try {
      await this._stat(filepath)
      return true
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
        return false
      } else {
        console.log('Unhandled error in "FileSystem.exists()" function', err)
        throw err
      }
    }
  }
  /**
   * Return the contents of a file if it exists, otherwise returns null.
   */
  async read (filepath /*: string */, options /*: Object */ = {}) {
    try {
      let buffer = await this._readFile(filepath, options)
      return buffer
    } catch (err) {
      return null
    }
  }
  /**
   * Write a file (creating missing directories if need be) without throwing errors.
   */
  async write (
    filepath /*: string */,
    contents /*: string|Buffer */,
    options /*: Object */ = {}
  ) {
    try {
      await this._writeFile(filepath, contents, options)
      return
    } catch (err) {
      // Hmm. Let's try mkdirp and try again.
      await this.mkdir(path.dirname(filepath))
      await this._writeFile(filepath, contents, options)
    }
  }
  /**
   * Make a directory (or series of nested directories) without throwing an error if it already exists.
   */
  async mkdir (filepath /*: string */) {
    try {
      await this._mkdir(filepath)
      return
    } catch (err) {
      // If err is null then operation succeeded!
      if (err === null) return
      // If the directory already exists, that's OK!
      if (err.code === 'EEXIST') return
      // If we got a "no such file or directory error" backup and try again.
      if (err.code === 'ENOENT') {
        let parent = path.dirname(filepath)
        // Check to see if we've gone too far
        if (parent === '.' || parent === '/' || parent === filepath) throw err
        // Infinite recursion, what could go wrong?
        await this.mkdir(parent)
        await this._mkdir(filepath)
      }
    }
  }
  /**
   * Delete a file without throwing an error if it is already deleted.
   */
  async rm (filepath) {
    try {
      await this._unlink(filepath)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }
  /**
   * Read a directory without throwing an error is the directory doesn't exist
   */
  async readdir (filepath) {
    try {
      return await this._readdir(filepath)
    } catch (err) {
      return []
    }
  }
  /**
   * Return a flast list of all the files nested inside a directory
   *
   * Based on an elegant concurrent recursive solution from SO
   * https://stackoverflow.com/a/45130990/2168416
   */
  async readdirDeep (dir) {
    const subdirs = await this._readdir(dir)
    const files = await Promise.all(
      subdirs.map(async subdir => {
        const res = dir + '/' + subdir
        return (await this._stat(res)).isDirectory()
          ? this.readdirDeep(res)
          : res
      })
    )
    return files.reduce((a, f) => a.concat(f), [])
  }

  async lock (filename, triesLeft = 3) {
    // check to see if we still have it
    if (delayedReleases.has(filename)) {
      clearTimeout(delayedReleases.get(filename))
      delayedReleases.delete(filename)
      return
    }
    if (triesLeft === 0) {
      throw new Error(
        `Unable to acquire lockfile '${filename}'. Exhausted tries.`
      )
    }
    try {
      await this._mkdir(`${filename}.lock`)
    } catch (err) {
      if (err.code === 'EEXIST') {
        await sleep(100)
        await this.lock(filename, triesLeft - 1)
      }
    }
  }

  async unlock (filename, delayRelease = 50) {
    if (delayedReleases.has(filename)) {
      throw new Error('Cannot double-release lockfile')
    }
    // Basically, we lie and say it was deleted ASAP.
    // But really we wait a bit to see if you want to acquire it again.
    delayedReleases.set(
      filename,
      setTimeout(async () => {
        delayedReleases.delete(filename)
        await this._rmdir(`${filename}.lock`)
      }, delayRelease)
    )
  }
}
