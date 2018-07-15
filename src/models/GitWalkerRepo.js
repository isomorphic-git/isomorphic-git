import { GitObjectManager } from "../managers/GitObjectManager";

export class GitWalkerRepo {
  constructor ({fs, gitdir, oid}) {
    this.fs = fs
    this.gitdir = gitdir
    this.map = new Map()
    this.map.set('.', oid)
  }
  async readdir(filepath) {
    let {fs, gitdir} = this
    let oid = this.map.get(filepath)
    let {type, object} = await GitObjectManager.read({fs, gitdir, oid})
    if (type !== 'tree') throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    // cache all entries
    for (entry of object.entries) {
      this.map.set(`${filepath}/${entry.path}`, entry)
    }
    return object.entries.map(entry => ({
      fullpath: `${filepath}/${entry.path}`,
      basename: entry.path
    }))
  }
  async populateStat(entry) {
    // All we can add here is mode and type.
    let stats = this.map.get(entry.fullpath)
    if (!stats) throw new Error(`ENOENT: no such file or directory, lstat '${entry.fullpath}'`)
    let {mode, type} = stats
    Object.assign(entry, {mode, type})
  }
  async populateContent (entry) {
    let {fs, gitdir} = this
    let oid = this.map.get(entry.fullpath)
    let {type, object} = await GitObjectManager.read({fs, gitdir, oid})
    if (type === 'tree') throw new Error(`EISDIR: illegal operation on a directory, read`)
    Object.assign(entry, {content: object})
  }
  async populateHash (entry) {
    let obj = this.map.get(entry.fullpath)
    if (!obj) throw new Error(`ENOENT: no such file or directory, open '${entry.fullpath}'`)
    let oid = obj.oid
    Object.assign(entry, {oid})
  }
}
