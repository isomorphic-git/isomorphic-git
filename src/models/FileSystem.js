import pify from 'pify'

import { E, GitError } from '../models/GitError.js'
import { compareStrings } from '../utils/compareStrings.js'
import { dirname } from '../utils/dirname.js'
import { sleep } from '../utils/sleep.js'

const delayedReleases = new Map()
/**
 * This is just a collection of helper functions really. At least that's how it started.
 */
export class FileSystem {
  constructor (fs) {
    // This is not actually the most logical place to put this, but in practice
    // putting the check here should work great.
    if (fs === undefined) {
      throw new GitError(E.PluginUndefined, { plugin: 'fs' })
    }
    if (typeof fs._readFile !== 'undefined') return fs
    if (
      Object.getOwnPropertyDescriptor(fs, 'promises') &&
      Object.getOwnPropertyDescriptor(fs, 'promises').enumerable
    ) {
      this._readFile = fs.promises.readFile.bind(fs.promises)
      this._writeFile = fs.promises.writeFile.bind(fs.promises)
      this._mkdir = fs.promises.mkdir.bind(fs.promises)
      this._rmdir = fs.promises.rmdir.bind(fs.promises)
      this._unlink = fs.promises.unlink.bind(fs.promises)
      this._stat = fs.promises.stat.bind(fs.promises)
      this._lstat = fs.promises.lstat.bind(fs.promises)
      this._readdir = fs.promises.readdir.bind(fs.promises)
      this._readlink = fs.promises.readlink.bind(fs.promises)
      this._symlink = fs.promises.symlink.bind(fs.promises)
    } else {
      this._readFile = pify(fs.readFile.bind(fs))
      this._writeFile = pify(fs.writeFile.bind(fs))
      this._mkdir = pify(fs.mkdir.bind(fs))
      this._rmdir = pify(fs.rmdir.bind(fs))
      this._unlink = pify(fs.unlink.bind(fs))
      this._stat = pify(fs.stat.bind(fs))
      this._lstat = pify(fs.lstat.bind(fs))
      this._readdir = pify(fs.readdir.bind(fs))
      this._readlink = pify(fs.readlink.bind(fs))
      this._symlink = pify(fs.symlink.bind(fs))
    }
  }
  /**
   * Return true if a file exists, false if it doesn't exist.
   * Rethrows errors that aren't related to file existance.
   */
  async exists (filepath, options = {}) {
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
  async read (filepath, options = {}) {
    try {
      let buffer = await this._readFile(filepath, options)
      // Convert plain ArrayBuffers to Buffers
      if (typeof buffer !== 'string') {
        buffer = Buffer.from(buffer)
      }
      return buffer
    } catch (err) {
      return null
    }
  }
  /**
   * Write a file (creating missing directories if need be) without throwing errors.
   */
  async write (filepath, contents, options = {}) {
    try {
      await this._writeFile(filepath, contents, options)
      return
    } catch (err) {
      // Hmm. Let's try mkdirp and try again.
      await this.mkdir(dirname(filepath))
      await this._writeFile(filepath, contents, options)
    }
  }
  /**
   * Make a directory (or series of nested directories) without throwing an error if it already exists.
   */
  async mkdir (filepath, _selfCall = false) {
    try {
      await this._mkdir(filepath)
      return
    } catch (err) {
      // If err is null then operation succeeded!
      if (err === null) return
      // If the directory already exists, that's OK!
      if (err.code === 'EEXIST') return
      // Avoid infinite loops of failure
      if (_selfCall) throw err
      // If we got a "no such file or directory error" backup and try again.
      if (err.code === 'ENOENT') {
        let parent = dirname(filepath)
        // Check to see if we've gone too far
        if (parent === '.' || parent === '/' || parent === filepath) throw err
        // Infinite recursion, what could go wrong?
        await this.mkdir(parent)
        await this.mkdir(filepath, true)
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
      let names = await this._readdir(filepath)
      // Ordering is not guaranteed, and system specific (Windows vs Unix)
      // so we must sort them ourselves.
      names.sort(compareStrings)
      return names
    } catch (err) {
      if (err.code === 'ENOTDIR') return null
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
  /**
   * Return the Stats of a file/symlink if it exists, otherwise returns null.
   * Rethrows errors that aren't related to file existance.
   */
  async lstat (filename) {
    try {
      let stats = await this._lstat(filename)
      return stats
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    }
  }
  /**
   * Reads the contents of a symlink if it exists, otherwise returns null.
   * Rethrows errors that aren't related to file existance.
   */
  async readlink (filename, opts = { encoding: 'buffer' }) {
    // Note: FileSystem.readlink returns a buffer by default
    // so we can dump it into GitObject.write just like any other file.
    try {
      return this._readlink(filename, opts)
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    }
  }
  /**
   * Write the contents of buffer to a symlink.
   */
  async writelink (filename, buffer) {
    return this._symlink(buffer.toString('utf8'), filename)
  }

  async lock (filename, triesLeft = 3) {
    // check to see if we still have it
    if (delayedReleases.has(filename)) {
      clearTimeout(delayedReleases.get(filename))
      delayedReleases.delete(filename)
      return
    }
    if (triesLeft === 0) {
      throw new GitError(E.AcquireLockFileFail, { filename })
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
      throw new GitError(E.DoubleReleaseLockFileFail, { filename })
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
