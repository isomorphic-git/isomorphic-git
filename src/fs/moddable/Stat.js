export class Stat {
  constructor(stats) {
    this.type = stats.type
    this.mode = stats.mode
    this.size = stats.size
    this.ino = stats.ino
    this.mtimeMs = stats.mtimeMs
    this.ctimeMs = stats.ctimeMs || stats.mtimeMs
    this.uid = 1
    this.gid = 1
    this.dev = 1
  }

  isFile() {
    return this.type === 'file'
  }

  isDirectory() {
    return this.type === 'dir'
  }

  isSymbolicLink() {
    return this.type === 'symlink'
  }
}
