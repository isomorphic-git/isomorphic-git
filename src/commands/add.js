import path from 'path'
import { GitIndexManager, GitObjectManager } from '../managers'
import { FileSystem } from '../models'

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{workdir, gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} args.filepath - The path to the file to add to the index.
 * @returns {Promise<void>} - Resolves successfully once the git index has been updated.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await add(repo, {filepath: 'README.md'})
 */
export async function add ({ gitdir, workdir, fs: _fs, filepath }) {
  const fs = new FileSystem(_fs)
  const type = 'blob'
  const object = await fs.read(path.join(workdir, filepath))
  if (object === null) throw new Error(`Could not read file '${filepath}'`)
  const oid = await GitObjectManager.write({ fs, gitdir, type, object })
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      let stats = await fs._lstat(path.join(workdir, filepath))
      index.insert({ filepath, stats, oid })
    }
  )
  // TODO: return oid?
}
