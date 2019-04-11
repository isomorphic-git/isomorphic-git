// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

// @see https://git-scm.com/docs/git-rev-parse.html#_specifying_revisions
const abbreviateRx = new RegExp('^refs/(heads/|tags/|remotes/)?(.*)')

function abbreviate (ref) {
  const match = abbreviateRx.exec(ref)
  if (match) {
    if (match[1] === 'remotes/' && ref.endsWith('/HEAD')) {
      return match[2].slice(0, -5)
    } else {
      return match[2]
    }
  }
  return ref
}

/**
 * Get the name of the branch currently pointed to by .git/HEAD
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
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
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  fullname = false
}) {
  try {
    const fs = new FileSystem(_fs)
    let ref = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    // Return `undefined` for detached HEAD
    if (!ref.startsWith('refs/')) return
    return fullname ? ref : abbreviate(ref)
  } catch (err) {
    err.caller = 'git.currentBranch'
    throw err
  }
}
