// Use this to create your own Git class with only a subset of
// the possible commands. By only importing the methods you
// actually need, and then combining them into your own class,
// you can get tree-shaking in Webpack or rollup and possibly
// eliminate hundreds of kilobytes of unused code like OpenPGP.js.
import { pkg } from './pkg'

export function createClass (methods = {}) {
  const Git = function Git ({ fs, dir, workdir, gitdir }) {
    if (fs) this.fs = fs
    if (dir) {
      this.workdir = dir
      this.gitdir = `${dir}/.git`
    }
    if (workdir) this.workdir = workdir
    if (gitdir) this.gitdir = gitdir
    if (!this.fs) {
      throw new Error("Missing required argument 'fs' in Git constructor.")
    }
    if (!this.gitdir) {
      throw new Error("Missing required argument 'gitdir' in Git constructor.")
    }
    return this
  }
  // Instance methods
  for (let key of Object.keys(methods)) {
    Git.prototype[key] = function (args) {
      return methods[key]({
        fs: this.fs,
        workdir: this.workdir,
        gitdir: this.gitdir,
        ...args
      })
    }
  }
  // Static methods
  Git.version = function version () {
    return pkg.version
  }
  return Git
}
