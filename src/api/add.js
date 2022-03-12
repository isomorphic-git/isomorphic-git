// @ts-check
import '../typedefs.js'

import * as allSettled from 'promise.allsettled'

import { MultipleGitError } from '../errors/MultipleGitError'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { _writeObject } from '../storage/writeObject.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

// TODO: remove once available in the lowest supported ES version
allSettled.shim()

/**
 * Add a file to the git index (aka staging area)
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string|string[]} args.filepath - The path to the file to add to the index
 * @param {object} [args.cache] - a [cache](cache.md) object
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
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('filepaths', filepath)

    const fs = new FileSystem(_fs)
    await GitIndexManager.acquire({ fs, gitdir, cache }, async index => {
      return addToIndex({ dir, gitdir, fs, filepath, index })
    })
  } catch (err) {
    err.caller = 'git.add'
    throw err
  }
}

async function addToIndex({ dir, gitdir, fs, filepath, index }) {
  // TODO: Should ignore UNLESS it's already in the index.
  filepath = Array.isArray(filepath) ? filepath : [filepath]
  const promises = filepath.map(async filePathIterator => {
    const ignored = await GitIgnoreManager.isIgnored({
      fs,
      dir,
      gitdir,
      filepath: filePathIterator,
    })
    if (ignored) return
    const stats = await fs.lstat(join(dir, filePathIterator))
    if (!stats) throw new NotFoundError(filePathIterator)

    if (stats.isDirectory()) {
      const children = await fs.readdir(join(dir, filePathIterator))
      const promises = children.map(child =>
        addToIndex({
          dir,
          gitdir,
          fs,
          filepath: [join(filePathIterator, child)],
          index,
        })
      )
      await Promise.all(promises)
    } else {
      const object = stats.isSymbolicLink()
        ? await fs.readlink(join(dir, filePathIterator))
        : await fs.read(join(dir, filePathIterator))
      if (object === null) throw new NotFoundError(filePathIterator)
      const oid = await _writeObject({ fs, gitdir, type: 'blob', object })
      index.insert({ filepath: filePathIterator, stats, oid })
    }
  })

  const settledPromises = await Promise.allSettled(promises)
  const rejectedPromises = settledPromises
    .filter(settle => settle.status === 'rejected')
    .map(settle => settle.reason)
  if (rejectedPromises.length > 1) {
    throw new MultipleGitError(rejectedPromises)
  }
  if (rejectedPromises.length === 1) {
    throw rejectedPromises[0]
  }

  const fulfilledPromises = settledPromises
    .filter(settle => settle.status === 'fulfilled')
    .map(settle => settle.value)

  return fulfilledPromises
}
