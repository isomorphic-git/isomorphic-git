import { flatFileListToDirectoryStructure } from "../utils/flatFileListToDirectoryStructure";

export class GitWalkerIndex {
  constructor({index}) {
    this.tree = flatFileListToDirectoryStructure(index.entries)
  }
  async readdir (filepath) {
    let inode = this.tree.get(filepath)
    if (!inode) return null
    if (inode.type !== 'tree') throw new Error(`ENOTDIR: not a directory, scandir '${filepath}'`)
    return inode.children.map(inode => ({
      fullpath: inode.fullpath,
      basename: inode.basename,
    }))
  }
  async populateStat (entry) {
    let inode = this.tree.get(filepath)
    if (!inode) throw new Error(`ENOENT: no such file or directory, lstat '${entry.fullpath}'`)
    Object.assign(entry, {
      fullpath: inode.fullpath,
      basename: inode.basename,
      type: inode.type,
      ctimeSeconds: inode.metadata.ctimeSeconds,
      ctimeNanoseconds: inode.metadata.ctimeNanoseconds,
      mtimeSeconds: inode.metadata.mtimeSeconds,
      mtimeNanoseconds: inode.metadata.mtimeNanoseconds,
      dev: inode.metadata.dev,
      ino: inode.metadata.ino,
      mode: inode.metadata.mode,
      uid: inode.metadata.uid
      gid: inode.metadata.gid
      size: inode.metadata.size
      flags: inode.metadata.flags
    }))
  }
  async populateContent (entry) {
    // Cannot get content for an index entry
    return
  }
  async populateHash (entry) {
    let inode = this.tree.get(filepath)
    if (!inode) return null
    if (inode.type === 'tree') throw new Error(`EISDIR: illegal operation on a directory, read`)
    Object.assign(entry, {
      oid: inode.metadata.oid,
    }))
  }
}
