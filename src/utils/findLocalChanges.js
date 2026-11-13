// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'

import { dirname } from './dirname.js'
import { modified } from './modified.js'

/**
 * Lists the local changes that writing the result of a three-way merge of
 * `headTree`, `baseTree` and `theirTree` into the working tree would destroy,
 * following git's rules: any staged change (the index differs from
 * `headTree`), plus unstaged edits, untracked files and directories at the
 * paths that differ between `baseTree` and `theirTree`. Untracked files that
 * `.gitignore` ignores are expendable, as in git, and are not reported, but
 * only when the rules are simple enough to be sure git agrees (the `strict`
 * check of `GitIgnoreManager.isIgnored`). An executable bit changed on disk
 * counts as an edit, unless `core.filemode` is false. With
 * `core.ignorecase`, an untracked file whose name differs only in case is in
 * the way too. A working tree that was never checked out (empty index) has
 * nothing staged, but the whole merge result is written into it, so every
 * path the result keeps is checked.
 *
 * Throws `UnmergedPathsError` if the index still has unmerged paths.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.headTree
 * @param {string} args.baseTree
 * @param {string} args.theirTree
 *
 * @returns {Promise<string[]>}
 */
export async function findLocalChanges({
  fs,
  cache,
  dir,
  gitdir,
  headTree,
  baseTree,
  theirTree,
}) {
  // Unmerged paths mean a previous merge is still unresolved. An empty index
  // means nothing was checked out yet, so nothing is staged either.
  const tracked = await GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async index => [...index.entriesMap.keys()]
  )
  const checkedOut = tracked.length > 0

  /** @type {string[]} */
  const staged = !checkedOut
    ? []
    : await _walk({
        fs,
        cache,
        dir,
        gitdir,
        trees: [TREE({ ref: headTree }), STAGE()],
        map: async (filepath, [head, stage]) => {
          if (filepath === '.') return
          // Directories are reported through the files inside them.
          if (
            (!head || (await head.type()) === 'tree') &&
            (!stage || (await stage.type()) === 'tree')
          ) {
            return
          }
          if (await modified(stage, head)) return filepath
        },
      })

  // Directories that theirs replaces with a file while ours changed something
  // inside: git keeps them, with everything in them.
  /** @type {string[]} */
  const kept = []
  /** @type {string[]} */
  const changed = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [
      TREE({ ref: baseTree }),
      TREE({ ref: theirTree }),
      TREE({ ref: headTree }),
    ],
    map: async (filepath, [base, their, head]) => {
      if (filepath === '.') return
      const same = async (x, y) =>
        x &&
        y &&
        (await x.oid()) === (await y.oid()) &&
        (await x.mode()) === (await y.mode())
      if (
        their &&
        head &&
        (await their.type()) === 'blob' &&
        (await head.type()) === 'tree' &&
        !(await same(base, head))
      ) {
        kept.push(filepath)
      }
      if (!checkedOut) {
        // Everything the result keeps is written: whatever either side has,
        // except what the other side deleted without changing it.
        if (
          (!their && (await same(base, head))) ||
          (!head && (await same(base, their)))
        ) {
          return null
        }
        const types = [
          head ? await head.type() : undefined,
          their ? await their.type() : undefined,
        ]
        if (types.includes('blob')) return filepath
        return
      }
      // Nothing is written where theirs did not change, where ours already
      // has their version, or where both sides deleted the file.
      if (
        (await same(base, their)) ||
        (await same(their, head)) ||
        (!their && !head)
      ) {
        return null
      }
      const types = [
        base ? await base.type() : undefined,
        their ? await their.type() : undefined,
      ]
      if (types.includes('blob')) return filepath
      // A file of ours where theirs has a directory is moved aside.
      if (types[1] === 'tree' && head && (await head.type()) === 'blob') {
        return filepath
      }
    },
  })
  if (changed.length === 0) return staged
  const config = await GitConfigManager.get({ fs, gitdir })
  // On a case-insensitive file system (core.ignorecase), a name that differs
  // only in case is the same file, as git sees it.
  const fold = (await config.get('core.ignorecase'))
    ? filepath => filepath.toLowerCase()
    : filepath => filepath
  const written = new Set(changed.map(fold))
  const keptDirs = new Set(kept.map(fold))
  // Tracked names in another case are the same file as the one on disk.
  const trackedFolded = new Set(tracked.map(fold))
  // The directories above the paths written.
  const above = new Set()
  for (const filepath of written) {
    for (let d = dirname(filepath); d !== '.'; d = dirname(d)) above.add(d)
  }
  // Whether a path in `paths` is above `filepath`.
  const below = (filepath, paths = written) => {
    for (let d = dirname(filepath); d !== '.'; d = dirname(d)) {
      if (paths.has(d)) return true
    }
    return false
  }
  // Like git, a changed executable bit is a local change, unless the
  // repository says the file system cannot be trusted with it.
  const filemode = (await config.get('core.filemode')) !== false

  /** @type {string[]} */
  const unstaged = await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: headTree }), WORKDIR()],
    map: async (filepath, [head, workdir]) => {
      if (filepath === '.') return
      const key = fold(filepath)
      if (!written.has(key) && !above.has(key) && !below(key)) return null
      const headOid =
        head && (await head.type()) === 'blob' ? await head.oid() : undefined
      // Like git, an untracked file that .gitignore ignores may be overwritten,
      // but only when the rules are simple enough to be sure git agrees, when
      // it is not a tracked file renamed in case, and when git does not keep
      // the directory it is in.
      const expendable = async () =>
        (await workdir.type()) === 'blob' &&
        !trackedFolded.has(key) &&
        !below(key, keptDirs) &&
        GitIgnoreManager.isIgnored({ fs, dir, gitdir, filepath, strict: true })
      // A tracked directory where the merge wants a file is judged through
      // the files inside it. In a working tree that was never checked out,
      // a directory there is just in the way.
      if (
        checkedOut &&
        head &&
        workdir &&
        (await head.type()) === 'tree' &&
        (await workdir.type()) === 'tree'
      ) {
        return
      }
      if (!written.has(key)) {
        // An untracked file where the merge needs a directory, or inside a
        // directory the merge replaces with a file.
        if (
          !headOid &&
          workdir &&
          (await workdir.type()) === 'blob' &&
          !(await expendable())
        ) {
          return filepath
        }
        return
      }
      // A file missing from the working tree has nothing to lose.
      if (!workdir) return
      // Untracked files and directories in the way.
      if (!headOid) return (await expendable()) ? undefined : filepath
      // Unstaged edits, and a directory where a tracked file was.
      if (
        (await workdir.type()) !== 'blob' ||
        (await workdir.oid()) !== headOid ||
        (filemode && (await workdir.mode()) !== (await head.mode()))
      ) {
        return filepath
      }
    },
  })
  return [...new Set([...staged, ...unstaged])]
}
