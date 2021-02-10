import '../typedefs.js'

import { _worktreeAdd } from '../commands/worktreeAdd.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Create a new working tree attached to an existing repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {HttpClient} args.http - an HTTP client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The path to create a new working tree into
 * @param {string} [args.ref=path.split('/').pop()] - What to name the new branch in the new working tree
 *
 * @returns {Promise<void>} Resolves successfully when worktree operation completes
 *
 * @example
 * await git.({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   path: '../hotfix'
 * })
 */
export async function worktreeAdd({
  fs,
  http,
  dir,
  gitdir = join(dir, '.git'),
  path,
  ref = path.split('/').pop(),
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('http', http)
    assertParameter('gitdir', gitdir)
    assertParameter('path', path)
    assertParameter('ref', ref)
    return await _worktreeAdd({
      fs: new FileSystem(fs),
      gitdir,
      path,
      ref,
    })
  } catch (err) {
    err.caller = 'git.worktreeAdd'
    throw err
  }
}
