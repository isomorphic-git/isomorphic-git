import { GitIndexManager } from '../managers/GitIndexManager.js'
import { compareStrings } from '../utils/compareStrings.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'
import { normalizeStats } from '../utils/normalizeStats'

import { FileSystem } from './FileSystem.js'

export class GitWalkerIndex2 {
  constructor ({ fs: _fs, gitdir }) {
    const fs = new FileSystem(_fs)
    this.treePromise = GitIndexManager.acquire({ fs, gitdir }, async function (
      index
    ) {
      return flatFileListToDirectoryStructure(index.entries)
    })
    const walker = this
    this.ConstructEntry = class StageEntry {
      constructor (fullpath) {
        this._fullpath = fullpath
        this._type = false
        this._mode = false
        this._stat = false
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
    const filepath = entry._fullpath
    const tree = await this.treePromise
    const inode = tree.get(filepath)
    if (!inode) return null
    if (inode.type === 'blob') return null
    if (inode.type !== 'tree') {
      throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    }
    return inode.children
      .map(inode => inode.fullpath
        // TODO: Figure out why flatFileListToDirectoryStructure is not returning children
        // sorted correctly for "__tests__/__fixtures__/test-push.git"
      )
      .sort((a, b) => compareStrings(a.fullpath, b.fullpath))
  }

  async type (entry) {
    if (entry._type === false) {
      await entry.stat()
    }
    return entry._type
  }

  async mode (entry) {
    if (entry._mode === false) {
      await entry.stat()
    }
    return entry._mode
  }

  async stat (entry) {
    if (entry._stat === false) {
      const tree = await this.treePromise
      const inode = tree.get(entry._fullpath)
      if (!inode) {
        throw new Error(
          `ENOENT: no such file or directory, lstat '${entry._fullpath}'`
        )
      }
      const stats = inode.type === 'tree' ? {} : normalizeStats(inode.metadata)
      entry._type = inode.type
      entry._mode = stats.mode
      if (inode.type === 'tree') {
        entry._stat = void 0
      } else {
        entry._stat = stats
      }
    }
    return entry._stat
  }

  async content (_entry) {
    // Cannot get content for an index entry
  }

  async oid (entry) {
    if (entry._oid === false) {
      const tree = await this.treePromise
      const inode = tree.get(entry._fullpath)
      entry._oid = inode.metadata.oid
    }
    return entry._oid
  }
}
