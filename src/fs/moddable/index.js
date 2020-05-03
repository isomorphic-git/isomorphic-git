/* eslint-disable no-debugger */

// import { File, Iterator, System } from 'file'
import { File, Iterator } from 'file'

class FsPromisesClient {
  static async readFile(path, options = {}) {
    if (options.encoding !== 'utf8') throw new Error('unrecognized encoding')

    let result = null
    try {
      const f = new File(path)
      result = f.read(String)
      f.close()
    } catch (e) {
      console.log(
        `Error reading file "${path}" with options ${JSON.stringify(options)}`
      )
      console.log(e.message)
      throw e
    }
    return result
  }

  static async writeFile(path, content, options) {
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

  static async unlink() {
    debugger
  }

  static async stat(path) {
    if (File.exists(path)) return {} // @@

    const e = new Error()
    e.code = 'ENOENT'
    throw e
  }

  static async lstat() {
    debugger
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
}

export default { promises: FsPromisesClient }
