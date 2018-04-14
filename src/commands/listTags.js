import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List all local tags
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @returns {Promise<string[]>} - Resolves successfully with an array of branch names.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let tags = await git.listTags(repo)
 * console.log(tags)
 */
export async function listTags ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs
}) {
  const fs = new FileSystem(_fs)
  return GitRefManager.listTags({ fs, gitdir })
}
