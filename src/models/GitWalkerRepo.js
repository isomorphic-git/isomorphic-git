import path from 'path'

import { GitObjectManager } from '../managers/GitObjectManager'
import { GitRefManager } from '../managers/GitRefManager.js'
import { resolveTree } from '../utils/resolveTree'

import { GitTree } from './GitTree.js'

export class GitWalkerRepo {
  constructor ({ fs, gitdir, ref }) {
    this.fs = fs
    this.gitdir = gitdir
    this.mapPromise = (async () => {
      let map = new Map()
      let oid = await GitRefManager.resolve({ fs, gitdir, ref })
      let tree = await resolveTree({ fs, gitdir, oid })
      map.set('.', tree.oid)
      return map
    })()
  }
  async readdir (filepath) {
    let { fs, gitdir } = this
    let map = await this.mapPromise
    let oid = map.get(filepath)
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type !== 'tree') { throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`) }
    let tree = GitTree.from(object)
    // cache all entries
    for (const entry of tree) {
      map.set(path.join(filepath, entry.path), entry)
    }
    return tree.entries().map(entry => ({
      fullpath: path.join(filepath, entry.path),
      basename: entry.path
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
    let oid = map.get(entry.fullpath)
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type === 'tree') { throw new Error(`EISDIR: illegal operation on a directory, read`) }
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
