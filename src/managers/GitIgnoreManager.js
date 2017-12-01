// @flow
import ignore from 'ignore'
import path from 'path'
import { read, setfs, fs as defaultfs } from '../utils'

// I'm putting this in a Manager because I reckon it could benefit
// from a LOT of cacheing.

// TODO: Implement .git/info/exclude

export class GitIgnoreManager {
  static async isIgnored ({
    gitdir,
    workdir,
    filepath,
    fs = defaultfs()
  }) /*: Promise<boolean> */ {
    setfs(fs)
    let pairs = [
      {
        gitignore: path.join(workdir, '.gitignore'),
        filepath
      }
    ]
    let pieces = filepath.split('/')
    for (let i = 1; i < pieces.length; i++) {
      let dir = pieces.slice(0, i).join('/')
      let file = pieces.slice(i).join('/')
      pairs.push({
        gitignore: path.join(workdir, dir, '.gitignore'),
        filepath: file
      })
    }
    let ignoredStatus = false
    for (let p of pairs) {
      let file
      try {
        file = await read(p.gitignore, 'utf8')
      } catch (err) {
        if (err.code === 'NOENT') continue
      }
      let ign = ignore().add(file)
      let unign = ignore().add(`**\n${file}`)
      // If the parent directory is excluded, we are done.
      // "It is not possible to re-include a file if a parent directory of that file is excluded. Git doesn’t list excluded directories for performance reasons, so any patterns on contained files have no effect, no matter where they are defined."
      // source: https://git-scm.com/docs/gitignore
      let parentdir = path.dirname(p.filepath)
      if (ign.ignores(parentdir)) return true
      // If the file is currently ignored, test for UNignoring.
      if (ignoredStatus) {
        ignoredStatus = unign.ignores(p.filepath)
      } else {
        ignoredStatus = ign.ignores(p.filepath)
      }
    }
    return ignoredStatus
  }
}
