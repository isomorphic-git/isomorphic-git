import { posix as path } from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { normalizeStats } from '../utils/normalizeStats.js'
import { GitWalkerSymbol } from '../utils/symbols.js'
import { log } from '../utils/log.js'
import { compareStats } from '../utils/compareStats.js';

import { GitObject } from './GitObject.js'

export class GitWalkerFs {
  constructor ({ fs, dir, gitdir }) {
    this.fs = fs
    this.dir = dir
    this.gitdir = gitdir
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
    let { fs, gitdir } = this
    let oid
    // See if we can use the SHA1 hash in the index.
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        let stage = index.entriesMap.get(entry.fullpath)
        if (!stage || compareStats(entry, stage)) {
          log(`INDEX CACHE MISS: calculating SHA for ${entry.fullpath}`)
          if (!entry.content) await entry.populateContent()
          oid = await GitObject.hash({ type: 'blob', object: entry.content })
          if (stage && oid === stage.oid) {
            index.insert({
              filepath: entry.fullpath,
              stats: entry,
              oid: oid
            })
          }
        } else {
          // Use the index SHA1 rather than compute it
          oid = stage.oid
        }
      }
    )
    Object.assign(entry, { oid })
  }
}

const WORKDIR = Object.create(null)
Object.defineProperty(WORKDIR, GitWalkerSymbol, {
  value: ({ fs, dir, gitdir }) => new GitWalkerFs({ fs, dir, gitdir })
})
Object.freeze(WORKDIR)
export { WORKDIR }
