import { GitRefManager } from '../managers/GitRefManager.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join'
import { resolveTree } from '../utils/resolveTree.js'
import { GitWalkerSymbol } from '../utils/symbols.js'

import { GitTree } from './GitTree.js'

class GitWalkerRepo {
  constructor ({ fs, gitdir, ref }) {
    this.fs = fs
    this.gitdir = gitdir
    this.mapPromise = (async () => {
      let map = new Map()
      let oid = await GitRefManager.resolve({ fs, gitdir, ref })
      let tree = await resolveTree({ fs, gitdir, oid })
      map.set('.', tree)
      return map
    })()
    let walker = this
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
    let filepath = entry.fullpath
    let { fs, gitdir } = this
    let map = await this.mapPromise
    let obj = map.get(filepath)
    if (!obj) throw new Error(`No obj for ${filepath}`)
    let oid = obj.oid
    if (!oid) throw new Error(`No oid for obj ${JSON.stringify(obj)}`)
    let { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'blob') return null
    if (type !== 'tree') {
      throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    }
    let tree = GitTree.from(object)
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
    let map = await this.mapPromise
    let stats = map.get(entry.fullpath)
    if (!stats) {
      throw new Error(
        `ENOENT: no such file or directory, lstat '${entry.fullpath}'`
      )
    }
    let { mode, type } = stats
    Object.assign(entry, { mode, type })
  }
  async populateContent (entry) {
    let map = await this.mapPromise
    let { fs, gitdir } = this
    let obj = map.get(entry.fullpath)
    if (!obj) throw new Error(`No obj for ${entry.fullpath}`)
    let oid = obj.oid
    if (!oid) throw new Error(`No oid for entry ${JSON.stringify(obj)}`)
    let { type, object } = await readObject({ fs, gitdir, oid })
    if (type === 'tree') {
      throw new Error(`EISDIR: illegal operation on a directory, read`)
    }
    Object.assign(entry, { content: object })
  }
  async populateHash (entry) {
    let map = await this.mapPromise
    let obj = map.get(entry.fullpath)
    if (!obj) {
      throw new Error(
        `ENOENT: no such file or directory, open '${entry.fullpath}'`
      )
    }
    let oid = obj.oid
    Object.assign(entry, { oid })
  }
}

export function TREE ({ fs, gitdir, ref }) {
  let o = Object.create(null)
  Object.defineProperty(o, GitWalkerSymbol, {
    value: function () {
      return new GitWalkerRepo({ fs, gitdir, ref })
    }
  })
  Object.freeze(o)
  return o
}
