import { GitIndexManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List all the tracked files in a repo
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @returns {Promise<string[]>} - Resolves successfully with an array of file paths.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * let files = await listFiles(repo)
 */
export async function listFiles ({ gitdir, fs: _fs }) {
  const fs = new FileSystem(_fs)
  let filenames
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      filenames = index.entries.map(x => x.path)
    }
  )
  return filenames
}
