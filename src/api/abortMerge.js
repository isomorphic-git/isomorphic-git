// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { IndexResetError } from '../errors/IndexResetError.js'
import { MergeNotSupportedError } from '../errors/MergeNotSupportedError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertNoSymlinkInLeadingPath } from '../utils/assertNoSymlinkInLeadingPath.js'
import { assertParameter } from '../utils/assertParameter.js'
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
 * NOTE: The behavior of this command differs slightly from canonical git in that an error will be thrown if a file exists in the index and nowhere else.
 * Canonical git will reset the file and continue aborting the merge in this case.
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
      map: async function (path, [head, workdir, index]) {
        const staged = !(await modified(workdir, index))
        const unmerged = unmergedPaths.includes(path)
        const unmodified = !(await modified(index, head))

        if (unmodified && !unmerged) return false
        if (head && index && (await head.type()) !== (await index.type()))
          throw new MergeNotSupportedError()
        if (
          (head && (await head.type()) === 'tree') ||
          (index && (await index.type()) === 'tree')
        )
          return false

        if (staged || unmerged) {
          return head
            ? {
                path,
                mode: await head.mode(),
                oid: await head.oid(),
                type: await head.type(),
                content: await head.content(),
              }
            : { path, deleted: true }
        }

        if (unmodified) return false
        else throw new IndexResetError(path)
      },
    })

    await GitIndexManager.acquire(
      { fs, gitdir: updatedGitdir, cache },
      async function (index) {
        // Restore only paths changed by the merge, retaining unrelated unstaged edits.
        for (const entry of results
          .filter(Boolean)
          .sort((a, b) => b.path.length - a.path.length)) {
          if (!entry.deleted) continue
          await assertNoSymlinkInLeadingPath(fs, dir, entry.path)
          await fs.rm(join(dir, entry.path))
          index.delete({ filepath: entry.path })
        }
        for (const entry of results.filter(Boolean)) {
          if (entry.deleted || entry.type !== 'blob') continue
          const filepath = join(dir, entry.path)
          await assertNoSymlinkInLeadingPath(fs, dir, entry.path)
          await fs.rm(filepath)
          if (entry.mode === 0o120000)
            await fs.writelink(filepath, Buffer.from(entry.content))
          else await fs.write(filepath, entry.content, { mode: entry.mode })
          index.insert({
            filepath: entry.path,
            oid: entry.oid,
            stats: await fs.lstat(filepath),
          })
        }
      }
    )
  } catch (err) {
    err.caller = 'git.abortMerge'
    throw err
  }
}
