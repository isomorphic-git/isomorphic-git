/* eslint-disable no-debugger */

// import { File, Iterator, System } from 'file'
import { File, Iterator } from 'file'
import { Stat } from 'fs/moddable/Stat'

class FsPromisesClient {
  static async readFile(path, options = {}) {
    if (options && options.encoding !== 'utf8') {
      throw new Error('unrecognized encoding')
    }

    let result = null
    try {
      const f = new File(path)
      result = f.read(String)
      f.close()
    } catch (e) {
      if (e.message === 'File: file not found') {
        const err = new Error('ENOENT')
        err.code = 'ENOENT'
        throw err
      }
      console.log(
        `Error reading file "${path}" with options ${JSON.stringify(options)}`
      )
      console.log(e.message)
      throw e
    }
    return result
  }

  static async writeFile(path, content, options) {
    if (typeof options === 'string') {
      options = { encoding: options }
    } else if (!options) {
      options = {}
    }

    if (typeof content === 'string') {
      if (!options.encoding || options.encoding === 'utf8') {
        content = ArrayBuffer.fromString(content)
      } else {
        console.log(
          `Error writing file "${path}" with options ${JSON.stringify(options)}`
        )
        throw new Error('unrecognized encoding')
      }
    }

    // Unwrap Uint8Array into raw ArrayBuffer
    if (content.buffer) {
      content = content.buffer
    }
    File.delete(path)
    const f = new File(path, true)
    f.write(content)
    f.close()
  }

  static async mkdir(path) {
    const parts = path.split('/')
    const dir = [parts.shift()]
    while (parts.length) {
      dir.push(parts.shift())
      File.createDirectory(dir.join('/'))
    }
  }

  static async rmdir() {
    debugger
  }

  static async unlink(path) {
    File.delete(path)
  }

  static async stat(path) {
    if (File.exists(path)) return {} // @@

    const e = new Error()
    e.code = 'ENOENT'
    throw e
  }

  static async lstat(path) {
    try {
      const f = new File(path)
      return new Stat({
        type: 'file',
        mode: 0o644,
        size: f.length,
        ino: 1,
        mtimeMs: 0,
        ctimeMs: 0,
        uid: 1,
        gid: 1,
        dev: 1,
      })
    } catch (e) {
      console.log(`new File(${path})`)
      debugger
      const err = new Error()
      err.code = 'ENOENT'
      throw err
    }
  }

  static async readdir(path) {
    const files = [...new Iterator(path)]
      .map(entry => entry.name)
      .filter(name => name !== '.' && name !== '..')
    return files
  }

  static async readlink() {
    debugger
  }

  static async symlink() {
    debugger
  }

  static async chmod() {
    debugger
  }
}

export default { promises: FsPromisesClient }
