import path from 'path'
import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'

/**
 * Remove a file from the git index (aka staging area)
 *
 * Note that this does NOT delete the file in the working directory.
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} args.filepath - The path to the file to remove to the index.
 * @returns {Promise<void>} - Resolves successfully once the git index has been updated.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await remove(repo, {filepath: 'README.md'})
 */
export async function remove ({
  workdir,
  gitdir = path.join(workdir, '.git'),
  fs: _fs,
  filepath
}) {
  const fs = new FileSystem(_fs)
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      index.delete({ filepath })
    }
  )
  // TODO: return oid?
}
