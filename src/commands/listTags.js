// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'

/**
 * List tags
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of tag names
 *
 * @example
 * let tags = await git.listTags({ dir: '$input((/))' })
 * console.log(tags)
 *
 */
export async function listTags ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git')
}) {
  try {
    const fs = new FileSystem(_fs)
    return GitRefManager.listTags({ fs, gitdir })
  } catch (err) {
    err.caller = 'git.listTags'
    throw err
  }
}
