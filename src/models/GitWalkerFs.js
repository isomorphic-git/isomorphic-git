import { posix as path } from 'path'

import { GitIgnoreManager } from '../managers/GitIgnoreManager'

import { GitObject } from './GitObject'

export class GitWalkerFs {
  constructor ({ fs, dir }) {
    this.fs = fs
    this.dir = dir
  }
  async readdir (entry) {
    if (entry === null) return []
    let filepath = entry.fullpath
    let { fs, dir } = this
    let names = await fs.readdir(path.join(this.dir, filepath))
    if (names === null) return null
    let entries = names.map(name => ({
      fullpath: path.join(filepath, name),
      basename: name
    }))
    // This does all the calls in parallel
    // by turning them into an array of Promises that will resolve
    // to themselves if they are not ignored, or to null if they
    // are supposed to be ignored
    let filtered = await Promise.all(
      entries.map(entry =>
        GitIgnoreManager.isIgnored({
          fs,
          dir,
          filepath: entry.fullpath
        }).then(ignored => (ignored ? null : entry))
      )
    )
    return filtered.filter(entry => entry !== null)
  }
  async populateStat (entry) {
    let stats = await this.fs._lstat(`${this.dir}/${entry.fullpath}`)
    if (!stats) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    Object.assign(entry, stats)
  }
  async populateContent (entry) {
    let content = await this.fs.read(`${this.dir}/${entry.fullpath}`)
    Object.assign(entry, { content })
  }
  async populateHash (entry) {
    let oid = await GitObject.hash({ type: 'blob', object: entry.content })
    Object.assign(entry, { oid })
  }
}
