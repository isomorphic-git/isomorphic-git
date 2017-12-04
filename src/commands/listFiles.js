import { GitIndexManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

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
export async function listFiles ({ gitdir, fs = defaultfs() }) {
  setfs(fs)
  let filenames
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    filenames = index.entries.map(x => x.path)
  })
  return filenames
}
