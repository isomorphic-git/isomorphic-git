import { GitObject } from "./GitObject";

export class GitWalkerFs {
  constructor ({fs, dir}) {
    this.fs = fs
    this.dir = dir
  }
  async readdir(filepath) {
    let names = await fs.readdir(`${this.dir}/${filepath}`)
    return names.map(name => ({
      fullpath: `${filepath}/${name}`,
      basename: name
    }))
  }
  async populateStat(entry) {
    let stats = await this.fs._lstat(`${this.dir}/${entry.fullpath}`)
    if (!stats) throw new Error(`ENOENT: no such file or directory, lstat '${entry.fullpath}'`)
    Object.assign(entry, stats)
  }
  async populateContent (entry) {
    let content = await this.fs.read(`${this.dir}/${entry.fullpath}`)
    Object.assign(entry, {content})
  }
  async populateHash (entry) {
    let oid = await GitObject.hash({ type: 'blob', object: entry.content})
    Object.assign(entry, {oid})
  }
}
