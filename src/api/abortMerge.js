// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { IndexResetError } from '../errors/IndexResetError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { assertParameter } from '../utils/assertParameter.js'
import { dirname } from '../utils/dirname.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'
import { modified } from '../utils/modified.js'

/**
 * Abort a merge in progress.
 *
 * Based on the behavior of git reset --merge, i.e.  "Resets the index and updates the files in the working tree that are different between <commit> and HEAD, but keeps those which are different between the index and working tree (i.e. which have changes which have not been added). If a file that is different between <commit> and the index has unstaged changes, reset is aborted."
 *
 * Essentially, abortMerge will reset any files affected by merge conflicts to their last known good version at HEAD.
 * Any unstaged changes are saved and any staged changes are reset as well.
 *
 * Like `git merge --abort`, it deletes the files the merge added (a conflicted file that is not in `commit`, or a staged file that is exactly as in one of the commits in `MERGE_HEAD`; anything there that is not a commit stored locally is ignored) and the folders this leaves empty, restores a file or folder the merge replaced with a folder, file or symlink (it never writes or deletes anything below a symlink on disk, also one named in another case on a case-insensitive file system, unless that symlink is the merge's and is deleted first), drops new index entries whose file is gone from disk, removes `MERGE_HEAD`, `MERGE_MSG`, `MERGE_MODE`, `AUTO_MERGE` and `MERGE_RR`, and refuses with an `IndexResetError` to touch a file that was staged and then modified again.
 *
 * Unlike git, it does not delete any other new file in the index: it only unstages it, so that the file stays on disk, untracked. git would delete it. Such a file is one you staged before or during the merge, or one the merge added but also changed (for example a renamed file it merged edits into). For the same reason, it refuses with an `IndexResetError`, before anything is touched, to restore a file of `commit` that the merge replaced with a folder when that folder holds a file it would keep (a new file it only unstages, or an untracked or ignored file, which git would delete), to restore a folder of `commit` that a file or symlink took the place of when that file or symlink is not exactly as in a commit in `MERGE_HEAD` (or conflicted), and to restore or delete a file below a symlink it keeps.
 *
 * **WARNING:** Running git merge with non-trivial uncommitted changes is discouraged: while possible, it may leave you in a state that is hard to back out of in the case of a conflict.
 * If there were uncommitted changes when the merge started (and especially if those changes were further modified after the merge was started), `git.abortMerge` will in some cases be unable to reconstruct the original (pre-merge) changes.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.commit='HEAD'] - commit to reset the index and worktree to, defaults to HEAD
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 */
export async function abortMerge({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  commit = 'HEAD',
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)

    const fs = new FileSystem(_fs)
    const trees = [TREE({ ref: commit }), WORKDIR(), STAGE()]
    let unmergedPaths = []

    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })
    // The commits being merged, to tell the files the merge added from new
    // files of the user's. Anything there that is not a commit stored here
    // is skipped.
    const mergeHead = await fs.read(`${updatedGitdir}/MERGE_HEAD`, 'utf8')
    for (const oid of (mergeHead || '').match(/^[0-9a-f]{40}$/gm) || []) {
      try {
        const { type } = await readObject({
          fs,
          cache,
          gitdir: updatedGitdir,
          oid,
        })
        if (type === 'commit') trees.push(TREE({ ref: oid }))
      } catch (err) {
        if (!(err instanceof NotFoundError)) throw err
      }
    }
    // Files of `commit` that the merge replaced with a folder, and the same
    // in lower case for a folder found under another case of the name (on a
    // case-insensitive file system).
    const replaced = new Set()
    const replacedFolded = new Set()
    const inReplaced = path => {
      for (let p = dirname(path); p !== '.'; p = dirname(p)) {
        if (replaced.has(p) || replacedFolded.has(p.toLowerCase())) return true
      }
      return false
    }
    // Folders of `commit` that a file or symlink kept on disk takes the place
    // of: nothing may be written below them, or it would go through a symlink.
    const blocked = new Set()
    const blocker = path => {
      for (let p = dirname(path); p !== '.'; p = dirname(p)) {
        if (blocked.has(p)) return p
      }
    }
    // A folder that is a symlink on disk, also under another case of its
    // name: nothing below it is written or deleted, unless it is deleted.
    const deleted = new Set()
    const links = new Map()
    const linkAbove = async path => {
      for (let p = dirname(path); p !== '.'; p = dirname(p)) {
        if (deleted.has(p)) return
        if (!links.has(p)) {
          const stats = await fs.lstat(`${dir}/${p}`)
          links.set(p, !!stats && stats.isSymbolicLink())
        }
        if (links.get(p)) return p
      }
    }
    await GitIndexManager.acquire(
      { fs, gitdir: updatedGitdir, cache },
      async function (index) {
        unmergedPaths = index.unmergedPaths
      }
    )

    const results = await _walk({
      fs,
      cache,
      dir,
      gitdir: updatedGitdir,
      trees,
      map: async function (path, [head, workdir, index, ...merged]) {
        // Only in a commit being merged: nothing to reset.
        if (!head && !workdir && !index) return null
        const staged = !(await modified(workdir, index))
        const unmerged = unmergedPaths.includes(path)
        const unmodified = !(await modified(index, head))
        const headType = head && (await head.type())
        const workdirType = workdir && (await workdir.type())
        // As the merge left it: conflicted, or exactly as in a commit being
        // merged.
        const fromMerge = async () => {
          if (unmerged) return true
          for (const theirs of merged) {
            if (theirs && !(await modified(index, theirs))) return true
          }
          return false
        }

        // The merge replaced a folder of `commit` with a file or symlink:
        // delete it, or the folder's files would be written through it.
        if (headType === 'tree' && workdir && workdirType !== 'tree') {
          if ((staged || unmerged) && (await fromMerge())) {
            deleted.add(path)
            return { path, type: 'delete' }
          }
          blocked.add(path)
        }

        if (staged || unmerged) {
          if (head) {
            const blocking = blocker(path) || (await linkAbove(path))
            if (blocking) throw new IndexResetError(blocking)
            if (headType === 'blob') {
              if (workdirType === 'tree') replaced.add(path)
              if (!workdir) {
                const stats = await fs.lstat(`${dir}/${path}`)
                if (stats && stats.isDirectory()) {
                  replacedFolded.add(path.toLowerCase())
                }
              }
            }
            return {
              path,
              mode: await head.mode(),
              oid: await head.oid(),
              type: headType,
              content: await head.content(),
            }
          }
          // A directory is handled through the files in it.
          if (workdirType === 'tree') return
          // Added by the merge: git deletes it. Any other new file is only
          // unstaged, so that its content stays on disk.
          if (await fromMerge()) {
            const link = await linkAbove(path)
            if (link) throw new IndexResetError(link)
            return { path, type: 'delete' }
          }
          // A file kept in a folder that replaced a file of `commit` would
          // stop that file from being restored.
          if (inReplaced(path)) throw new IndexResetError(path)
          return { path, type: 'unstage' }
        }
        // Only in the index: git drops it and carries on.
        if (!head && !workdir) return { path, type: 'unstage' }
        if (inReplaced(path) && workdir) {
          // An untracked or ignored file in such a folder.
          if (workdirType !== 'tree') throw new IndexResetError(path)
          // A folder in it that holds no file of the index.
          return { path, type: 'emptydir' }
        }

        if (unmodified) return false
        else throw new IndexResetError(path)
      },
      // Files of `commit` gone from disk first, so that a folder named in
      // another case is recorded before the walk goes into it.
      iterate: async (walk, children) => {
        const all = [...children]
        const gone = all.filter(([head, workdir]) => head && !workdir)
        const rest = all.filter(([head, workdir]) => !head || workdir)
        return [
          ...(await Promise.all(gone.map(walk))),
          ...(await Promise.all(rest.map(walk))),
        ]
      },
    })

    await GitIndexManager.acquire(
      { fs, gitdir: updatedGitdir, cache },
      async function (index) {
        // Reset paths in index and worktree, this can't be done in _walk because the
        // STAGE walker acquires its own index lock.

        // Deletions first: on a case-insensitive file system, deleting
        // `foo.txt` after restoring `Foo.txt` would delete the restored file.
        for (const entry of results) {
          if (entry === false) continue
          if (entry.type === 'delete') {
            await fs.rm(`${dir}/${entry.path}`)
            // Like git, remove the folders this leaves empty.
            let parent = dirname(entry.path)
            while (parent !== '.') {
              const names = await fs.readdir(`${dir}/${parent}`)
              if (names.length > 0) break
              await fs.rmdir(`${dir}/${parent}`)
              parent = dirname(parent)
            }
          }
          if (entry.type === 'delete' || entry.type === 'unstage') {
            index.delete({ filepath: entry.path })
          }
        }
        // Then the folders left in a folder that replaced a file of `commit`,
        // deepest first, and that folder.
        for (const entry of [...results].reverse()) {
          if (entry && entry.type === 'emptydir') {
            await fs.rmdir(`${dir}/${entry.path}`)
          }
        }
        for (const path of [...replaced, ...replacedFolded]) {
          await fs.rmdir(`${dir}/${path}`)
        }

        for (const entry of results) {
          if (entry === false) continue

          if (entry.type === 'blob') {
            // Written the way checkout writes files: a fresh file, so that
            // its mode is right, and a symlink as a link.
            const fullpath = `${dir}/${entry.path}`
            await fs.rm(fullpath)
            if (entry.mode === 0o120000) {
              // Unlike `fs.write`, `fs.writelink` makes no missing folder.
              await fs.mkdir(dirname(fullpath))
              await fs.writelink(fullpath, Buffer.from(entry.content))
            } else {
              await fs.write(
                fullpath,
                entry.content,
                entry.mode === 0o100755 ? { mode: 0o777 } : {}
              )
            }
            const stats = await fs.lstat(fullpath)
            // The executable bit from lstat cannot be trusted on Windows.
            if (entry.mode === 0o100755) stats.mode = 0o755
            index.insert({ filepath: entry.path, stats, oid: entry.oid })
          }
        }
      }
    )
    // The merge is over: forget it, as git does.
    for (const file of [
      'MERGE_HEAD',
      'MERGE_MSG',
      'MERGE_MODE',
      'AUTO_MERGE',
      'MERGE_RR',
    ]) {
      await fs.rm(`${updatedGitdir}/${file}`)
    }
  } catch (err) {
    err.caller = 'git.abortMerge'
    throw err
  }
}
