import { fs as defaultfs, setfs } from '../utils'
import path from 'path'
import pify from 'pify'

async function test (filepath) {
  try {
    await pify(defaultfs().lstat)(path.join(filepath, '.git'))
    return true
  } catch (err) {
    return false
  }
}

/**
 * Find the root git directory
 * @param {GitRepo} repo - A {@link Git} object matching `{fs}`
 * @param {Object} args - An options object
 * @param {string} args.filepath - The file directory to start searching in.
 * @returns {Promise<string>} - a directory name
 * @throws {Error} - Error('Unable to find git root')
 *
 * Starting at `filepath`, will walk upwards until it finds a directory that contains a directory called '.git'.
 *
 * @example
 * import fs from 'fs'
 * import { Git, findRoot } from 'isomorphic-git'
 * let repo = new Git({fs, dir: '.'})
 *
 * let gitroot = await findRoot(repo, {
 *   filepath: '/path/to/some/gitrepo/path/to/some/file.txt'
 * })
 * // gitroot = '/path/to/some/gitrepo'
 */
export async function findRoot ({ fs = defaultfs() }, { filepath }) {
  setfs(fs)
  if (await test(filepath)) return filepath
  let parent = path.dirname(filepath)
  if (parent === filepath) throw new Error('Unable to find git root')
  return findRoot({ fs }, { filepath: parent })
}
