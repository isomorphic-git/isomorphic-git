import ignore from 'ignore'

import { FileSystem } from '../models/FileSystem.js'
import { basename } from '../utils/basename.js'
import { dirname } from '../utils/dirname.js'
import { join } from '../utils/join.js'

// I'm putting this in a Manager because I reckon it could benefit
// from a LOT of cacheing.

// TODO: Implement .git/info/exclude

export class GitIgnoreManager {
  static async isIgnored ({
    fs: _fs,
    dir,
    gitdir = join(dir, '.git'),
    filepath
  }) {
    const fs = new FileSystem(_fs)
    // ALWAYS ignore ".git" folders.
    if (basename(filepath) === '.git') return true
    // '.' is not a valid gitignore entry, so '.' is never ignored
    if (filepath === '.') return false
    // Find all the .gitignore files that could affect this file
    let pairs = [
      {
        gitignore: join(dir, '.gitignore'),
        filepath
      }
    ]
    let pieces = filepath.split('/')
    for (let i = 1; i < pieces.length; i++) {
      let folder = pieces.slice(0, i).join('/')
      let file = pieces.slice(i).join('/')
      pairs.push({
        gitignore: join(dir, folder, '.gitignore'),
        filepath: file
      })
    }
    let ignoredStatus = false
    for (let p of pairs) {
      let file
      try {
        file = await fs.read(p.gitignore, 'utf8')
      } catch (err) {
        if (err.code === 'NOENT') continue
      }
      let ign = ignore().add(file)
      // If the parent directory is excluded, we are done.
      // "It is not possible to re-include a file if a parent directory of that file is excluded. Git doesn’t list excluded directories for performance reasons, so any patterns on contained files have no effect, no matter where they are defined."
      // source: https://git-scm.com/docs/gitignore
      let parentdir = dirname(p.filepath)
      if (parentdir !== '.' && ign.ignores(parentdir)) return true
      // If the file is currently ignored, test for UNignoring.
      if (ignoredStatus) {
        ignoredStatus = !ign.test(p.filepath).unignored
      } else {
        ignoredStatus = ign.test(p.filepath).ignored
      }
    }
    return ignoredStatus
  }
}
