// @ts-check
import '../typedefs.js'

import { _abortRebase } from '../commands/rebase.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Abort a rebase that stopped on conflicts
 *
 * Like `git rebase --abort`: puts the branch back where it was before the rebase and checks it out (or detaches HEAD there, for a rebase of a detached HEAD), which discards the conflict and any other change to tracked files, and forgets the rebase.
 * It refuses, with nothing changed, when an untracked file is where the branch has a file, or would have to go with a directory: that throws a `RebaseLocalChangesError`. git refuses too, but replaces ignored files and directories; the library refuses for those as well, so nothing is lost.
 *
 * Throws a `NotFoundError` when no rebase is in progress, and a `RebaseNotSupportedError`, with nothing changed, for a rebase started with `--autostash`: git applies the stashed changes again on abort, so use `git rebase --abort`.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully once the branch is back where it was
 *
 * @example
 * await git.abortRebase({ fs, dir: '/tutorial' })
 *
 */
export async function abortRebase({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)

    const fs = new FileSystem(_fs)
    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })
    await _abortRebase({ fs, cache, dir, gitdir: updatedGitdir })
  } catch (err) {
    err.caller = 'git.abortRebase'
    throw err
  }
}
