// @ts-check
import '../typedefs.js'

import { _init } from '../commands/init.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Initialize a new repository
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @param {string} [args.defaultBranch = 'master'] - The name of the default branch (might be changed to a required argument in 2.0.0)
 * @param {boolean} [args.noHooks = false] - By default init creates an empty `hooks` folder. `noHooks` disables that behavior. Chrome refuses to create `.git/hooks` through the File System Access API, see [Using the File System Access API](guide-browser-file-system-access.md).
 * @param {boolean} [args.noConfig = false] - By default init writes a `config` file. `noConfig` disables that behavior, and git then uses its default settings. Chromium is adding `.git/config` to the paths the File System Access API refuses to write. Once that ships, writing the config fails, see [Using the File System Access API](guide-browser-file-system-access.md).
 * @returns {Promise<void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.init({ fs, dir: '/tutorial' })
 * console.log('done')
 *
 */
export async function init({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  defaultBranch = 'master',
  noHooks = false,
  noConfig = false,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    if (!bare) {
      assertParameter('dir', dir)
    }

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _init({
      fs: fsp,
      bare,
      dir,
      gitdir: updatedGitdir,
      defaultBranch,
      noHooks,
      noConfig,
    })
  } catch (err) {
    err.caller = 'git.init'
    throw err
  }
}
