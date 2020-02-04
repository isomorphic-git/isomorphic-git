// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { abbreviateRef } from '../utils/abbreviateRef.js'
import { join } from '../utils/join.js'

/**
 * Get the name of the branch currently pointed to by .git/HEAD
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.fullname = false] - Return the full path (e.g. "refs/heads/master") instead of the abbreviated form.
 *
 * @returns {Promise<string|undefined>} The name of the current branch or undefined if the HEAD is detached.
 *
 * @example
 * // Get the current branch name
 * let branch = await git.currentBranch({ dir: '$input((/))', fullname: $input((false)) })
 * console.log(branch)
 *
 */
export async function currentBranch ({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  fullname = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    // Return `undefined` for detached HEAD
    if (!ref.startsWith('refs/')) return
    return fullname ? ref : abbreviateRef(ref)
  } catch (err) {
    err.caller = 'git.currentBranch'
    throw err
  }
}
