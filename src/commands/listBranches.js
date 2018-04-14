import path from 'path'

import { GitRefManager } from '../managers'
import { FileSystem } from '../models'

/**
 * List branches
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} [remote=undefined] - If specified, lists the branches for that remote. Otherwise lists local branches.
 * @returns {Promise<string[]>} - Resolves successfully with an array of branch names.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let branches = await git.listBranches(repo)
 * console.log(branches)
 */
export async function listBranches ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  remote = undefined
}) {
  const fs = new FileSystem(_fs)
  return GitRefManager.listBranches({ fs, gitdir, remote })
}
