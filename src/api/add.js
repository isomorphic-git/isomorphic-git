// @ts-check
import '../typedefs.js'

import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { _writeObject } from '../storage/writeObject.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'
import {MultipleGitError} from "../errors/MultipleGitError";

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to add to the index
 * @param {string[]} args.filepaths - The paths to the files to add to the index
 *
 * @returns {Promise<void>} Resolves successfully once the git index has been updated
 *
 * @example
 * await fs.promises.writeFile('/tutorial/README.md', `# TEST`)
 * await git.add({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log('done')
 *
 */
export async function add({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  filepaths = [filepath],
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('filepaths', filepaths[0])

    const fs = new FileSystem(_fs)
    const cache = {}
    await GitIndexManager.acquire({ fs, gitdir, cache }, async function(index) {
      await addToIndex({ dir, gitdir, fs, filepaths, index })
    })
  } catch (err) {
    err.caller = 'git.add'
    throw err
  }
}

async function addToIndex({ dir, gitdir, fs, filepaths, index }) {
  // TODO: Should ignore UNLESS it's already in the index.
  const promises = filepaths.map(async filepath => {
    const ignored = await GitIgnoreManager.isIgnored({
      fs,
      dir,
      gitdir,
      filepath,
    })
    if (ignored) return
    const stats = await fs.lstat(join(dir, filepath))
    if (!stats) throw new NotFoundError(filepath)
    if (stats.isDirectory()) {
      const children = await fs.readdir(join(dir, filepath))
      const promises = children.map(child =>
        addToIndex({ dir, gitdir, fs, filepaths: [join(filepath, child)], index })
      )
      await Promise.all(promises)
    } else {
      const object = stats.isSymbolicLink()
        ? await fs.readlink(join(dir, filepath))
        : await fs.read(join(dir, filepath))
      if (object === null) throw new NotFoundError(filepath)
      const oid = await _writeObject({ fs, gitdir, type: 'blob', object })
      index.insert({ filepath, stats, oid })
    }
  })

  const settledPromises = await Promise.allSettled(promises)
  const rejectedPromises = settledPromises
    .filter(settle => settle.status === 'rejected')
    .map(settle => settle.reason)
  if (rejectedPromises.length) {
    throw new MultipleGitError(
      rejectedPromises
    )
  }

  const fufilledPromises = settledPromises
    .filter(settle => settle.status === 'fulfilled')
    .map(settle => settle.value)

  return fufilledPromises
}
