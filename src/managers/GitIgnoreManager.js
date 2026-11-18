import '../typedefs.js'

import ignore from 'ignore'

import { basename } from '../utils/basename.js'
import { dirname } from '../utils/dirname.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

import { GitConfigManager } from './GitConfigManager.js'

// I'm putting this in a Manager because I reckon it could benefit
// from a LOT of caching.
export class GitIgnoreManager {
  /**
   * Determines whether a given file is ignored based on `.gitignore` rules and exclusion files.
   * Matching is case-sensitive when `core.ignorecase` is false, and follows
   * fnmatch rules for character classes (`[!a]` negates the class).
   *
   * @param {Object} args
   * @param {FSClient} args.fs - A file system implementation.
   * @param {string} args.dir - The working directory.
   * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
   * @param {string} args.filepath - The path of the file to check.
   * @returns {Promise<boolean>} - `true` if the file is ignored, `false` otherwise.
   */
  static async isIgnored({ fs, dir, gitdir = join(dir, '.git'), filepath }) {
    // ALWAYS ignore ".git" folders.
    if (basename(filepath) === '.git') return true
    // '.' is not a valid gitignore entry, so '.' is never ignored
    if (filepath === '.') return false
    // Resolve the real git directory first: in a submodule (or worktree)
    // `.git` is a file pointing at the real git directory, and neither the
    // config nor the exclude file can be read through it.
    gitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })
    // A linked worktree keeps its shared config (and info/exclude) in the
    // directory named by the private gitdir's `commondir` file; ordinary
    // repos and submodules have no such file and keep using `gitdir`.
    let configGitdir = gitdir
    const commondir = await fs.read(join(gitdir, 'commondir'), 'utf8')
    if (commondir) {
      const commondirPath = commondir.trim()
      // Worktrees use absolute gitdir paths; submodules use relative ones.
      const isAbsolute =
        commondirPath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(commondirPath)
      configGitdir = isAbsolute ? commondirPath : join(gitdir, commondirPath)
    }
    // Whether .gitignore matching is case-sensitive is governed by
    // core.ignorecase. Canonical git sets it to true on init when its probe
    // detects a case-insensitive filesystem, and normally leaves it unset
    // on a case-sensitive filesystem; when it is unset, keep the `ignore`
    // library's default of case-insensitive matching.
    let ignorecase = true
    const config = await GitConfigManager.get({ fs, gitdir: configGitdir })
    const ignorecaseValue = await config.get('core.ignorecase')
    if (ignorecaseValue !== undefined) {
      ignorecase = ignorecaseValue
    }
    // Check and load exclusion rules from project exclude file (.git/info/exclude).
    // Read it once: it may vanish between an existence check and the read,
    // and `ignore` 7.x throws on `add(null)`, so only add it when the read
    // returns content. (A missing file reads back as null.)
    const excludes = await fs.read(
      join(configGitdir, 'info', 'exclude'),
      'utf8'
    )
    // Find all the .gitignore files that could affect this file
    const pairs = [
      {
        gitignore: join(dir, '.gitignore'),
        filepath,
      },
    ]
    const pieces = filepath.split('/').filter(Boolean)
    for (let i = 1; i < pieces.length; i++) {
      const folder = pieces.slice(0, i).join('/')
      const file = pieces.slice(i).join('/')
      pairs.push({
        gitignore: join(dir, folder, '.gitignore'),
        filepath: file,
      })
    }
    let ignoredStatus = false
    for (const [index, p] of pairs.entries()) {
      const file = await fs.read(p.gitignore, 'utf8')
      const ign = ignore({ ignorecase })
      // The patterns in .git/info/exclude are relative to the working directory,
      // so only the first pair, which holds the full filepath, can use them.
      if (index === 0 && excludes) ign.add(excludes)
      // A missing .gitignore reads back as null, and `ignore` 7.x throws on
      // `add(null)`, so only add when there is something to add.
      if (file) ign.add(file)
      // If the parent directory is excluded, we are done.
      // "It is not possible to re-include a file if a parent directory of that file is excluded. Git doesn’t list excluded directories for performance reasons, so any patterns on contained files have no effect, no matter where they are defined."
      // source: https://git-scm.com/docs/gitignore
      const parentdir = dirname(p.filepath)
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
