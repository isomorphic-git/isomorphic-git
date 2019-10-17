import { GitIndexManager } from '../managers/GitIndexManager.js'
import { compareStats } from '../utils/compareStats.js'
import { join } from '../utils/join'
import { log } from '../utils/log.js'
import { normalizeStats } from '../utils/normalizeStats.js'
import { shasum } from '../utils/shasum.js'

import { FileSystem } from './FileSystem.js'
import { GitObject } from './GitObject.js'

export class GitWalkerFs {
  constructor ({ fs: _fs, dir, gitdir }) {
    const fs = new FileSystem(_fs)
    this.fs = fs
    this.dir = dir
    this.gitdir = gitdir
    const walker = this
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
    const filepath = entry.fullpath
    const { fs, dir } = this
    const names = await fs.readdir(join(dir, filepath))
    if (names === null) return null
    return names.map(name => ({
      fullpath: join(filepath, name),
      basename: name,
      exists: true
    }))
  }

  async populateStat (entry) {
    if (!entry.exists) return
    const { fs, dir } = this
    let stats = await fs.lstat(`${dir}/${entry.fullpath}`)
    let type = stats.isDirectory() ? 'tree' : 'blob'
    if (type === 'blob' && !stats.isFile() && !stats.isSymbolicLink()) {
      type = 'special'
    }
    if (!stats) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    stats = normalizeStats(stats)
    Object.assign(entry, { type }, stats)
  }

  async populateContent (entry) {
    if (!entry.exists) return
    const { fs, dir } = this
    const content = await fs.read(`${dir}/${entry.fullpath}`)
    // workaround for a BrowserFS edge case
    if (entry.size === -1) entry.size = content.length
    Object.assign(entry, { content })
  }

  async populateHash (entry) {
    if (!entry.exists) return
    const { fs, gitdir } = this
    // See if we can use the SHA1 hash in the index.
    const oid = await GitIndexManager.acquire({ fs, gitdir }, async function (
      index
    ) {
      const stage = index.entriesMap.get(entry.fullpath)
      if (!entry.type) await entry.populateStat()
      if (!stage || compareStats(entry, stage)) {
        log(`INDEX CACHE MISS: calculating SHA for ${entry.fullpath}`)
        if (!entry.content) await entry.populateContent()
        const oid = shasum(
          GitObject.wrap({ type: 'blob', object: entry.content })
        )
        if (stage && oid === stage.oid) {
          index.insert({
            filepath: entry.fullpath,
            stats: entry,
            oid: oid
          })
        }
        return oid
      } else {
        // Use the index SHA1 rather than compute it
        return stage.oid
      }
    })
    Object.assign(entry, { oid })
  }
}
