import { GitRefManager } from '../managers/GitRefManager.js'
import { E } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join'
import { resolveTree } from '../utils/resolveTree.js'

import { FileSystem } from './FileSystem.js'
import { GitTree } from './GitTree.js'

export class GitWalkerRepo {
  constructor ({ fs: _fs, gitdir, ref }) {
    const fs = new FileSystem(_fs)
    this.fs = fs
    this.gitdir = gitdir
    this.mapPromise = (async () => {
      const map = new Map()
      let oid
      try {
        oid = await GitRefManager.resolve({ fs, gitdir, ref })
      } catch (e) {
        // Handle fresh branches with no commits
        if (e.code === E.ResolveRefError) {
          oid = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
        }
      }
      const tree = await resolveTree({ fs, gitdir, oid })
      tree.type = 'tree'
      map.set('.', tree)
      return map
    })()
    const walker = this
    this.ConstructEntry = class RepoEntry {
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
    const { fs, gitdir } = this
    const map = await this.mapPromise
    const obj = map.get(filepath)
    if (!obj) throw new Error(`No obj for ${filepath}`)
    const oid = obj.oid
    if (!oid) throw new Error(`No oid for obj ${JSON.stringify(obj)}`)
    if (obj.type === 'commit') {
      // TODO: support submodules
      return null
    }
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'blob') return null
    if (type !== 'tree') {
      throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    }
    const tree = GitTree.from(object)
    // cache all entries
    for (const entry of tree) {
      map.set(join(filepath, entry.path), entry)
    }
    return tree.entries().map(entry => ({
      fullpath: join(filepath, entry.path),
      basename: entry.path,
      exists: true
    }))
  }

  async populateStat (entry) {
    // All we can add here is mode and type.
    const map = await this.mapPromise
    const stats = map.get(entry.fullpath)
    if (!stats) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    const { mode, type } = stats
    Object.assign(entry, { mode, type })
  }

  async populateContent (entry) {
    const map = await this.mapPromise
    const { fs, gitdir } = this
    const obj = map.get(entry.fullpath)
    if (!obj) throw new Error(`No obj for ${entry.fullpath}`)
    const oid = obj.oid
    if (!oid) throw new Error(`No oid for entry ${JSON.stringify(obj)}`)
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'tree') {
      throw new Error(`EISDIR: illegal operation on a directory, read`)
    }
    Object.assign(entry, { content: object })
  }

  async populateHash (entry) {
    const map = await this.mapPromise
    const obj = map.get(entry.fullpath)
    if (!obj) {
      throw new Error(
        `ENOENT: no such file or directory, open '${entry.fullpath}'`
      )
    }
    const oid = obj.oid
    Object.assign(entry, { oid })
  }
}
