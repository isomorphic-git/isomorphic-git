import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { compareStats } from '../utils/compareStats.js'
import { join } from '../utils/join.js'
import { normalizeStats } from '../utils/normalizeStats.js'
import { shasum } from '../utils/shasum.js'

import { GitObject } from './GitObject.js'

export class GitWalkerFs {
  constructor({ fs, dir, gitdir, cache }) {
    this.fs = fs
    this.cache = cache
    this.dir = dir
    this.gitdir = gitdir
    const walker = this
    this.ConstructEntry = class WorkdirEntry {
      constructor(fullpath) {
        this._fullpath = fullpath
        this._type = false
        this._mode = false
        this._stat = false
        this._content = false
        this._oid = false
      }

      async type() {
        return walker.type(this)
      }

      async mode() {
        return walker.mode(this)
      }

      async stat() {
        return walker.stat(this)
      }

      async content() {
        return walker.content(this)
      }

      async oid() {
        return walker.oid(this)
      }
    }
  }

  async readdir(entry) {
    const filepath = entry._fullpath
    const { fs, dir } = this
    const names = await fs.readdir(join(dir, filepath))
    if (names === null) return null
    return names.map(name => join(filepath, name))
  }

  async type(entry) {
    if (entry._type === false) {
      await entry.stat()
    }
    return entry._type
  }

  async mode(entry) {
    if (entry._mode === false) {
      await entry.stat()
    }
    return entry._mode
  }

  async stat(entry) {
    if (entry._stat === false) {
      const { fs, dir } = this
      let stat = await fs.lstat(`${dir}/${entry._fullpath}`)
      if (!stat) {
        throw new Error(
          `ENOENT: no such file or directory, lstat '${entry._fullpath}'`
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

  async content(entry) {
    if (entry._content === false) {
      const { fs, dir, gitdir } = this
      if ((await entry.type()) === 'tree') {
        entry._content = undefined
      } else {
        const config = await GitConfigManager.get({ fs, gitdir })
        const autocrlf = await config.get('core.autocrlf')
        const content = await fs.read(`${dir}/${entry._fullpath}`, { autocrlf })
        // workaround for a BrowserFS edge case
        entry._actualSize = content.length
        if (entry._stat && entry._stat.size === -1) {
          entry._stat.size = entry._actualSize
        }
        entry._content = new Uint8Array(content)
      }
    }
    return entry._content
  }

  async oid(entry) {
    if (entry._oid === false) {
      const { fs, gitdir, cache } = this
      let oid
      // See if we can use the SHA1 hash in the index.
      await GitIndexManager.acquire({ fs, gitdir, cache }, async function(
        index
      ) {
        const stage = index.entriesMap.get(entry._fullpath)
        const stats = await entry.stat()
        const config = await GitConfigManager.get({ fs, gitdir })
        const filemode = await config.get('core.filemode')
        const trustino = !(process.platform === 'win32')
        if (!stage || compareStats(stats, stage, filemode, trustino)) {
          const content = await entry.content()
          if (content === undefined) {
            oid = undefined
          } else {
            oid = await shasum(
              GitObject.wrap({ type: 'blob', object: await entry.content() })
            )
            // Update the stats in the index so we will get a "cache hit" next time
            // 1) if we can (because the oid and mode are the same)
            // 2) and only if we need to (because other stats differ)
            if (
              stage &&
              oid === stage.oid &&
              (!filemode || stats.mode === stage.mode) &&
              compareStats(stats, stage, filemode, trustino)
            ) {
              index.insert({
                filepath: entry._fullpath,
                stats,
                oid: oid,
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
