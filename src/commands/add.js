import path from 'path'
import pify from 'pify'
import { GitIndexManager, GitObjectManager } from '../managers'
import { fs as defaultfs, setfs, read } from '../utils'

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
export async function add ({ gitdir, workdir, fs = defaultfs() }, { filepath }) {
  setfs(fs)
  const type = 'blob'
  const object = await read(path.join(workdir, filepath))
  if (object === null) throw new Error(`Could not read file '${filepath}'`)
  const oid = await GitObjectManager.write({ gitdir, type, object })
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    let stats = await pify(fs.lstat)(path.join(workdir, filepath))
    index.insert({ filepath, stats, oid })
  })
  // TODO: return oid?
}
