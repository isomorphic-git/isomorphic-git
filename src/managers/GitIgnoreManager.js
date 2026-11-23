import '../typedefs.js'

import ignore from 'ignore'

import { basename } from '../utils/basename.js'
import { join } from '../utils/join.js'

// Test `pieces` (a path relative to the working directory) against every
// matcher whose .gitignore can see it, deepest rule last. A .gitignore's
// patterns are relative to the directory holding it, so a matcher only sees
// the trailing pieces of the path below its own directory. The working
// directory's matcher also holds .git/info/exclude, whose patterns are relative
// to the working directory, and it is the only one that sees the whole path.
function testPath(matchers, pieces, isDirectory) {
  let ignored = false
  for (const { depth, ign } of matchers) {
    const relative = pieces.slice(depth).join('/')
    if (relative === '') continue
    const result = ign.test(isDirectory ? `${relative}/` : relative)
    // A deeper .gitignore overrides a shallower one, and a matcher with no
    // matching pattern leaves the verdict alone.
    if (ignored) {
      if (result.unignored) ignored = false
    } else if (result.ignored) {
      ignored = true
    }
  }
  return ignored
}

// I'm putting this in a Manager because I reckon it could benefit
// from a LOT of caching.
export class GitIgnoreManager {
  /**
   * Determines whether a given file is ignored based on `.gitignore` rules and exclusion files.
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
    // A directory is tested with a trailing slash so that a pattern written as
    // `name/` (which only matches directories) can match it.
    const isDirectory = filepath.endsWith('/')
    const pieces = filepath.split('/').filter(Boolean)
    // Check and load exclusion rules from project exclude file (.git/info/exclude)
    let excludes = ''
    const excludesFile = join(gitdir, 'info', 'exclude')
    if (await fs.exists(excludesFile)) {
      excludes = await fs.read(excludesFile, 'utf8')
    }
    // Build one matcher per directory from the working directory down to the
    // file's own directory. Matcher 0 also holds .git/info/exclude, whose
    // patterns are relative to the working directory. A directory that is
    // itself excluded has no .gitignore in effect — "It is not possible to
    // re-include a file if a parent directory of that file is excluded" — so
    // the walk stops as soon as one is found and the result is `true`.
    // source: https://git-scm.com/docs/gitignore
    const matchers = []
    const limit = isDirectory ? pieces.length : pieces.length - 1
    for (let depth = 0; depth <= limit; depth++) {
      // Every ancestor above this one is already known not to be excluded, so
      // `relativePieces` is judged by the matchers gathered so far.
      const relativePieces = pieces.slice(0, depth)
      if (depth > 0 && testPath(matchers, relativePieces, true)) {
        return true
      }
      const ign = ignore()
      if (depth === 0) ign.add(excludes)
      const folder = relativePieces.join('/')
      ign.add(await fs.read(join(dir, folder, '.gitignore'), 'utf8'))
      matchers.push({ depth, ign })
    }
    return testPath(matchers, pieces, isDirectory)
  }
}
