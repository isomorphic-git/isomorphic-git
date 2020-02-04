// @ts-check
import '../commands/typedefs.js'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { E, GitError } from '../models/GitError.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.filepath
 * @returns {Promise<void>}
 */
export async function add ({
  fs,
  dir,
  gitdir,
  filepath
}) {
  await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
    await addToIndex({ dir, gitdir, fs, filepath, index })
  })
}

async function addToIndex ({ dir, gitdir, fs, filepath, index }) {
  // TODO: Should ignore UNLESS it's already in the index.
  const ignored = await GitIgnoreManager.isIgnored({
    fs,
    dir,
    gitdir,
    filepath
  })
  if (ignored) return
  const stats = await fs.lstat(join(dir, filepath))
  if (!stats) throw new GitError(E.FileReadError, { filepath })
  if (stats.isDirectory()) {
    const children = await fs.readdir(join(dir, filepath))
    const promises = children.map(child =>
      addToIndex({ dir, gitdir, fs, filepath: join(filepath, child), index })
    )
    await Promise.all(promises)
  } else {
    const object = stats.isSymbolicLink()
      ? await fs.readlink(join(dir, filepath))
      : await fs.read(join(dir, filepath))
    if (object === null) throw new GitError(E.FileReadError, { filepath })
    const oid = await writeObject({ fs, gitdir, type: 'blob', object })
    index.insert({ filepath, stats, oid })
  }
}
