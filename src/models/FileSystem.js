import pify from 'pify'

import { compareStrings } from '../utils/compareStrings.js'
import { dirname } from '../utils/dirname.js'
import { rmRecursive } from '../utils/rmRecursive.js'
import { isPromiseLike } from '../utils/types.js'

function isPromiseFs(fs) {
  const test = targetFs => {
    try {
      // If readFile returns a promise then we can probably assume the other
      // commands do as well
      return targetFs.readFile().catch(e => e)
    } catch (e) {
      return e
    }
  }
  return isPromiseLike(test(fs))
}

// List of commands all filesystems are expected to provide. `rm` is not
// included since it may not exist and must be handled as a special case
const commands = [
  'readFile',
  'writeFile',
  'mkdir',
  'rmdir',
  'unlink',
  'stat',
  'lstat',
  'readdir',
  'readlink',
  'symlink',
]

function bindFs(target, fs) {
  if (isPromiseFs(fs)) {
    for (const command of commands) {
      target[`_${command}`] = fs[command].bind(fs)
    }
  } else {
    for (const command of commands) {
      target[`_${command}`] = pify(fs[command].bind(fs))
    }
  }

  // Handle the special case of `rm`
  if (isPromiseFs(fs)) {
    if (fs.rm) target._rm = fs.rm.bind(fs)
    else if (fs.rmdir.length > 1) target._rm = fs.rmdir.bind(fs)
    else target._rm = rmRecursive.bind(null, target)
  } else {
    if (fs.rm) target._rm = pify(fs.rm.bind(fs))
    else if (fs.rmdir.length > 2) target._rm = pify(fs.rmdir.bind(fs))
    else target._rm = rmRecursive.bind(null, target)
  }
}

/**
 * This is just a collection of helper functions really. At least that's how it started.
 */
export class FileSystem {
  constructor(fs) {
    if (typeof fs._original_unwrapped_fs !== 'undefined') return fs

    const promises = Object.getOwnPropertyDescriptor(fs, 'promises')
    if (promises && promises.enumerable) {
      bindFs(this, fs.promises)
    } else {
      bindFs(this, fs)
    }
    this._original_unwrapped_fs = fs
  }

  /**
   * Return true if a file exists, false if it doesn't exist.
   * Rethrows errors that aren't related to file existence.
   */
  async exists(filepath, options = {}) {
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
   *
   * @param {string} filepath
   * @param {object} [options]
   *
   * @returns {Promise<Buffer|string|null>}
   */
  async read(filepath, options = {}) {
    try {
      let buffer = await this._readFile(filepath, options)
      if (options.autocrlf === 'true') {
        try {
          buffer = new TextDecoder('utf8', { fatal: true }).decode(buffer)
          buffer = buffer.replace(/\r\n/g, '\n')
          buffer = new TextEncoder().encode(buffer)
        } catch (error) {
          // non utf8 file
        }
      }
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
   *
   * @param {string} filepath
   * @param {Buffer|Uint8Array|string} contents
   * @param {object|string} [options]
   */
  async write(filepath, contents, options = {}) {
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
  async mkdir(filepath, _selfCall = false) {
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
        const parent = dirname(filepath)
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
  async rm(filepath) {
    try {
      await this._unlink(filepath)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }

  /**
   * Delete a directory without throwing an error if it is already deleted.
   */
  async rmdir(filepath, opts) {
    try {
      if (opts && opts.recursive) {
        await this._rm(filepath, opts)
      } else {
        await this._rmdir(filepath)
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }

  /**
   * Read a directory without throwing an error is the directory doesn't exist
   */
  async readdir(filepath) {
    try {
      const names = await this._readdir(filepath)
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
  async readdirDeep(dir) {
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
   * Rethrows errors that aren't related to file existence.
   */
  async lstat(filename) {
    try {
      const stats = await this._lstat(filename)
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
   * Rethrows errors that aren't related to file existence.
   */
  async readlink(filename, opts = { encoding: 'buffer' }) {
    // Note: FileSystem.readlink returns a buffer by default
    // so we can dump it into GitObject.write just like any other file.
    try {
      const link = await this._readlink(filename, opts)
      return Buffer.isBuffer(link) ? link : Buffer.from(link)
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
  async writelink(filename, buffer) {
    return this._symlink(buffer.toString('utf8'), filename)
  }
}
