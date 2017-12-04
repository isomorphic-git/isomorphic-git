import { GitIndexManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

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
export async function remove ({ gitdir, fs = defaultfs() }, { filepath }) {
  setfs(fs)
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath })
  })
  // TODO: return oid?
}
