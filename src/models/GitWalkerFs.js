import { posix as path } from 'path'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { normalizeStats } from '../utils/normalizeStats'
import { GitWalkerSymbol } from '../utils/symbols.js'

import { GitObject } from './GitObject.js'

export class GitWalkerFs {
  constructor ({ fs, dir }) {
    this.fs = fs
    this.dir = dir
    let walker = this
    this.ConstructEntry = class FSEntry {
      constructor (entry) {
        Object.assign(this, entry)
      }
      async populateStat () {
        if (!this.exists) return
        await walker.populateStat(this)
      }
      async populateContent () {
        if (!this.exists) return
        await walker.populateContent(this)
      }
      async populateHash () {
        if (!this.exists) return
        await walker.populateHash(this)
      }
    }
  }
  async readdir (entry) {
    if (!entry.exists) return []
    let filepath = entry.fullpath
    let { fs, dir } = this
    let names = await fs.readdir(path.join(this.dir, filepath))
    if (names === null) return null
    let entries = names.map(name => ({
      fullpath: path.join(filepath, name),
      basename: name,
      exists: true
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
    let type = stats.isDirectory() ? 'tree' : 'blob'
    if (!stats) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    stats = normalizeStats(stats)
    Object.assign(entry, { type }, stats)
  }
  async populateContent (entry) {
    let content = await this.fs.read(`${this.dir}/${entry.fullpath}`)
    Object.assign(entry, { content })
  }
  async populateHash (entry) {
    if (!entry.content) await entry.populateContent()
    let oid = await GitObject.hash({ type: 'blob', object: entry.content })
    Object.assign(entry, { oid })
  }
}

const WORKDIR = Object.create(null)
Object.defineProperty(WORKDIR, GitWalkerSymbol, {
  value: ({ fs, dir }) => new GitWalkerFs({ fs, dir })
})
Object.freeze(WORKDIR)
export { WORKDIR }
