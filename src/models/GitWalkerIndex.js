import { GitIndexManager } from '../managers/GitIndexManager.js'
import { compareStrings } from '../utils/compareStrings.js'
import { flatFileListToDirectoryStructure } from '../utils/flatFileListToDirectoryStructure.js'
import { normalizeStats } from '../utils/normalizeStats'

import { FileSystem } from './FileSystem.js'

export class GitWalkerIndex {
  constructor ({ fs: _fs, gitdir }) {
    const fs = new FileSystem(_fs)
    this.treePromise = GitIndexManager.acquire({ fs, gitdir }, async function (
      index
    ) {
      return flatFileListToDirectoryStructure(index.entries)
    })
    const walker = this
    this.ConstructEntry = class IndexEntry {
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
    const tree = await this.treePromise
    const inode = tree.get(filepath)
    if (!inode) return null
    if (inode.type === 'blob') return null
    if (inode.type !== 'tree') {
      throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    }
    return inode.children
      .map(inode => ({
        fullpath: inode.fullpath,
        basename: inode.basename,
        exists: true
        // TODO: Figure out why flatFileListToDirectoryStructure is not returning children
        // sorted correctly for "__tests__/__fixtures__/test-push.git"
      }))
      .sort((a, b) => compareStrings(a.fullpath, b.fullpath))
  }

  async populateStat (entry) {
    const tree = await this.treePromise
    const inode = tree.get(entry.fullpath)
    if (!inode) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    const stats = inode.type === 'tree' ? {} : normalizeStats(inode.metadata)
    Object.assign(entry, { type: inode.type }, stats)
  }

  async populateContent (entry) {
    // Cannot get content for an index entry
  }

  async populateHash (entry) {
    const tree = await this.treePromise
    const inode = tree.get(entry.fullpath)
    if (!inode) return null
    if (inode.type === 'tree') {
      throw new Error(`EISDIR: illegal operation on a directory, read`)
    }
    Object.assign(entry, {
      oid: inode.metadata.oid
    })
  }
}
