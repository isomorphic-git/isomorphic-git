import { GitIndexManager } from '../managers/GitIndexManager.js'
import { compareStats } from '../utils/compareStats.js'
import { join } from '../utils/join'
import { log } from '../utils/log.js'
import { normalizeStats } from '../utils/normalizeStats.js'
import { shasum } from '../utils/shasum.js'

import { FileSystem } from './FileSystem.js'
import { GitObject } from './GitObject.js'

export class GitWalkerFs2 {
  constructor ({ fs: _fs, dir, gitdir }) {
    const fs = new FileSystem(_fs)
    this.fs = fs
    this.dir = dir
    this.gitdir = gitdir
    const walker = this
    this.ConstructEntry = class WorkdirEntry {
      constructor (entry) {
        Object.assign(this, entry)
        this._type = false
        this._mode = false
        this._stat = false
        this._content = false
        this._oid = false
      }

      async type () {
        return walker.type(this)
      }

      async mode () {
        return walker.mode(this)
      }

      async stat () {
        return walker.stat(this)
      }

      async content () {
        return walker.content(this)
      }

      async oid () {
        return walker.oid(this)
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

  async type (entry) {
    if (!entry.exists) return
    if (entry._type === false) {
      await entry.stat()
    }
    return entry._type
  }

  async mode (entry) {
    if (!entry.exists) return
    if (entry._mode === false) {
      await entry.stat()
    }
    return entry._mode
  }

  async stat (entry) {
    if (!entry.exists) return
    if (entry._stat === false) {
      const { fs, dir } = this
      let stat = await fs.lstat(`${dir}/${entry.fullpath}`)
      if (!stat) {
        throw new Error(
          `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
        )
      }
      let type = stat.isDirectory() ? 'tree' : 'blob'
      if (type === 'blob' && !stat.isFile() && !stat.isSymbolicLink()) {
        type = 'special'
      }
      entry._type = type
      stat = normalizeStats(stat)
      entry._mode = stat.mode
      // workaround for a BrowserFS edge case
      if (stat.size === -1 && entry._actualSize) {
        stat.size = entry._actualSize
      }
      entry._stat = stat
    }
    return entry._stat
  }

  async content (entry) {
    if (!entry.exists) return
    if (entry._content === false) {
      const { fs, dir } = this
      if ((await entry.type()) === 'tree') {
        entry._content = void 0
      } else {
        const content = await fs.read(`${dir}/${entry.fullpath}`)
        // workaround for a BrowserFS edge case
        entry._actualSize = content.length
        if (entry._stat && entry._stat.size === -1) { entry._stat.size = entry._actualSize }
        entry._content = content
      }
    }
    return entry._content
  }

  async oid (entry) {
    if (!entry.exists) return
    if (entry._oid === false) {
      const { fs, gitdir } = this
      let oid
      // See if we can use the SHA1 hash in the index.
      await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        const stage = index.entriesMap.get(entry.fullpath)
        const stats = await entry.stat()
        if (!stage || compareStats(stats, stage)) {
          log(`INDEX CACHE MISS: calculating SHA for ${entry.fullpath}`)
          const content = await entry.content()
          if (content === void 0) {
            oid = void 0
          } else {
            oid = shasum(
              GitObject.wrap({ type: 'blob', object: await entry.content() })
            )
            if (stage && oid === stage.oid) {
              index.insert({
                filepath: entry.fullpath,
                stats,
                oid: oid
              })
            }
          }
        } else {
          // Use the index SHA1 rather than compute it
          oid = stage.oid
        }
      })
      entry._oid = oid
    }
    return entry._oid
  }
}
