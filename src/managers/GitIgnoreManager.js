import '../typedefs.js'

import ignore from 'ignore'

import { basename } from '../utils/basename.js'
import { dirname } from '../utils/dirname.js'
import { join } from '../utils/join.js'

// git skips a rule file of this size or more.
const MAX_RULE_FILE_BYTES = 100 * 1024 * 1024

// Whether a rule file is one git skips, or has a rule that the `ignore`
// package may match differently from git. Trusted rules are printable ASCII,
// with no negation (`!`), character class (`[`), backslash escape, or `**`
// other than a leading `**/`. Comment lines are skipped.
function hasUntrustedRule(rules) {
  if (!rules) return false
  // Count the bytes only when there may be enough of them: one UTF-16 unit
  // is at most 3 bytes in UTF-8.
  if (
    rules.length * 3 >= MAX_RULE_FILE_BYTES &&
    new TextEncoder().encode(rules).length >= MAX_RULE_FILE_BYTES
  ) {
    return true
  }
  return rules
    .split(/\r?\n/)
    .some(
      line =>
        !line.startsWith('#') &&
        (/[^\x20-\x7e]|[![\\]/.test(line) ||
          line.replace(/^\*\*\//, '').includes('**'))
    )
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
   * @param {boolean} [args.strict = false] - For callers that may delete an ignored file (like checkout overwriting an untracked file in its way): answer `true` only when the rules are of a kind matched like git, so git ignores the file too. The answer is `false` unless the path is printable ASCII without `\` and without an empty or dots-only name, every rule file that applies can be read, is not a symbolic link (for a `.gitignore`) and is under 100 MiB (git skips larger ones), every rule that applies (in the `.gitignore` files and `.git/info/exclude`) is printable ASCII without `!`, `[`, `\`, or `**` (except a `**` and slash that start the rule), and the file is ignored both with and without regard to case (so `core.ignorecase`, from any config file, cannot change the answer). Rules from `core.excludesFile` are not read; git gives them the lowest priority, so they cannot un-ignore a file.
   * @returns {Promise<boolean>} - `true` if the file is ignored, `false` otherwise.
   */
  static async isIgnored({
    fs,
    dir,
    gitdir = join(dir, '.git'),
    filepath,
    strict = false,
  }) {
    // ALWAYS ignore ".git" folders (but never delete one in strict mode).
    if (basename(filepath) === '.git') return !strict
    // '.' is not a valid gitignore entry, so '.' is never ignored
    if (filepath === '.') return false
    if (strict) {
      // `?` and case folding work on UTF-16 units here but on bytes in git,
      // `dirname` splits at a `\` that git reads as a plain character, and
      // the `ignore` package throws on an empty or dots-only name like `...`.
      if (/[^\x20-\x7e]|\\|(^|\/)\.*(\/|$)/.test(filepath)) return false
    }
    // Check and load exclusion rules from project exclude file (.git/info/exclude)
    let excludes = ''
    const excludesFile = join(gitdir, 'info', 'exclude')
    try {
      if (await fs.exists(excludesFile)) {
        excludes = await fs.read(excludesFile, 'utf8')
      }
    } catch (err) {
      // In strict mode, rules that can't be read can't be trusted.
      if (strict) return false
      throw err
    }
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
    // In strict mode, check every rule file before trusting any of them.
    const files = []
    if (strict) {
      if (hasUntrustedRule(excludes)) return false
      for (const p of pairs) {
        let file
        try {
          // git does not read a .gitignore that is a symbolic link.
          const stats = await fs.lstat(p.gitignore)
          if (stats && stats.isSymbolicLink()) return false
          file = await fs.read(p.gitignore, 'utf8')
        } catch (err) {
          return false
        }
        if (hasUntrustedRule(file)) return false
        files.push(file)
      }
    }
    let ignoredStatus = false
    for (const [index, p] of pairs.entries()) {
      const file = strict ? files[index] : await fs.read(p.gitignore, 'utf8')
      // Strict mode matches case-sensitively. Its rules have no negation, so
      // a file ignored this way is also ignored without regard to case: the
      // answer is the same whatever core.ignorecase is, in any config file.
      const ign = ignore({ ignorecase: !strict })
      // The patterns in .git/info/exclude are relative to the working directory,
      // so only the first pair, which holds the full filepath, can use them.
      if (index === 0) ign.add(excludes)
      ign.add(file)
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
