// @ts-check
import '../typedefs.js'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 *
 * @typedef {Object} UnmergedVersion - One side of an unmerged file
 * @property {string} oid - The SHA-1 object id of the blob
 * @property {string} mode - The file mode, e.g. `'100644'`
 *
 */

/**
 *
 * @typedef {Object} UnmergedFile - A file the last merge or cherry-pick could not resolve
 * @property {string} filepath - The file's path relative to the repository root
 * @property {UnmergedVersion} [base] - The version in the merge base, if the file existed there
 * @property {UnmergedVersion} [ours] - Our version, if we did not delete the file
 * @property {UnmergedVersion} [theirs] - Their version, if they did not delete the file
 *
 */

/**
 * List the files left unmerged by a merge or cherry-pick, with the versions the index holds for each
 *
 * This is the information `git ls-files -u` and `git status` use: a conflicted file keeps up to three entries in the index, the merge base (stage 1), ours (stage 2) and theirs (stage 3).
 * A side that deleted the file has no entry. Each version can be read with [readBlob](./readBlob.md).
 * Staging the file with [add](./add.md) or [remove](./remove.md) marks it resolved and takes it off this list.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<UnmergedFile>>} Resolves successfully with the unmerged files, in path order
 * @see UnmergedFile
 *
 * @example
 * try {
 *   await git.merge({ fs, dir: '/tutorial', theirs: 'feature', abortOnConflict: false })
 * } catch (e) {
 *   if (!(e instanceof Errors.MergeConflictError)) throw e
 * }
 * const unmerged = await git.listUnmergedFiles({ fs, dir: '/tutorial' })
 * console.log(unmerged)
 * // [{ filepath: 'app.js', base: { oid, mode }, ours: { oid, mode }, theirs: { oid, mode } }]
 *
 */
export async function listUnmergedFiles({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)

    const fs = new FileSystem(_fs)
    const updatedGitdir = await discoverGitdir({ fsp: fs, dotgit: gitdir })
    return await GitIndexManager.acquire(
      { fs, gitdir: updatedGitdir, cache },
      async index => {
        const version = entry =>
          entry && { oid: entry.oid, mode: entry.mode.toString(8) }
        return index.entries
          .filter(entry => entry.stages.length > 1)
          .map(entry => ({
            filepath: entry.path,
            base: version(entry.stages[1]),
            ours: version(entry.stages[2]),
            theirs: version(entry.stages[3]),
          }))
      }
    )
  } catch (err) {
    err.caller = 'git.listUnmergedFiles'
    throw err
  }
}
