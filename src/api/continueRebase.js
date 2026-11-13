// @ts-check
import '../typedefs.js'

import { _continueRebase } from '../commands/rebase.js'
import { MissingNameError } from '../errors/MissingNameError.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'

/**
 * Continue a rebase that stopped on conflicts
 *
 * Like `git rebase --continue`: once the conflicts are resolved and the files are [added](./add.md), the stopped commit is created with its original author and the message in `.git/rebase-merge/message` (unless it was already committed, or nothing is left of it), and the remaining commits are replayed.
 * When `git rebase -i` stopped to edit a commit, staged changes amend that commit, as git does.
 * The next conflict stops the rebase again; when all commits are done, the branch is moved to the result and checked out.
 * In a rebase git started with `-i` or `--empty=stop`, a commit that becomes empty stops it too, as in git: that throws an `EmptyCommitError`, and continuing again drops the commit.
 *
 * With `skip: true` the stopped commit is dropped instead, like `git rebase --skip`.
 *
 * Throws an `UnmergedPathsError` while conflicts are still unresolved, a `RebaseLocalChangesError` over unstaged changes (git refuses them too), and a `NotFoundError` when no rebase is in progress.
 * A rebase it cannot finish throws a `RebaseNotSupportedError`, with nothing changed, so git can finish it: one whose to-do list (from `git rebase -i`) has commands other than `pick`, one started with `--autostash`, whose stashed changes git applies at the end, or one started with an option that changes how the rest is replayed (`--signoff`, `-S`, `--committer-date-is-author-date`, `--ignore-date`, `--empty=keep`, `--update-refs`, `-X`, `--strategy`, `--root`, or any other that git records in `.git/rebase-merge`).
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.skip=false] - Drop the stopped commit instead of committing its resolution
 * @param {Object} [args.committer] - The committer of the replayed commits. If not specified, uses user.name and user.email config with current timestamp.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {number} [args.committer.timestamp=Math.floor(Date.now()/1000)] - Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {MergeDriverCallback} [args.mergeDriver] - a [merge driver](mergeDriver.md) implementation
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<RebaseResult>} Resolves successfully once the branch has been rebased
 * @see RebaseResult
 *
 * @example
 * await git.add({ fs, dir: '/tutorial', filepath: 'app.js' })
 * const { oid } = await git.continueRebase({ fs, dir: '/tutorial' })
 * console.log(oid)
 *
 */
export async function continueRebase({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  skip = false,
  committer,
  mergeDriver,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)

    const fs = new FileSystem(_fs)
    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })

    const normalizedCommitter = await normalizeCommitterObject({
      fs,
      gitdir: updatedGitdir,
      committer,
    })
    if (!normalizedCommitter) throw new MissingNameError('committer')

    return await _continueRebase({
      fs,
      cache,
      dir,
      gitdir: updatedGitdir,
      skip,
      committer: normalizedCommitter,
      mergeDriver,
    })
  } catch (err) {
    err.caller = 'git.continueRebase'
    throw err
  }
}
