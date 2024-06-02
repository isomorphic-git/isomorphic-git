// @ts-check
import '../typedefs.js'

import { _getConfigAll } from '../commands/getConfigAll.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * Read a multi-valued entry from the git config files.
 *
 * *Caveats:*
 * - Currently only the local `$GIT_DIR/config` file and global `~/.gitconfig` can be read or written. However support for system `$(prefix)/etc/gitconfig` will be added in the future.
 * - The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - The [git directory](dir-vs-gitdir.md) path, required if global is not true and dir is missing
 * @param {boolean} [args.global=false] - Use global git directory
 * @param {string} args.path - The key of the git config entry
 *
 * @returns {Promise<Array<any>>} Resolves with the config value
 *
 */
export async function getConfigAll({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  global = false,
  path,
}) {
  try {
    assertParameter('fs', fs)
    if (global !== true) {
      assertParameter('gitdir', gitdir)
    }
    assertParameter('path', path)

    return await _getConfigAll({
      fs: new FileSystem(fs),
      gitdir,
      global,
      path,
    })
  } catch (err) {
    err.caller = 'git.getConfigAll'
    throw err
  }
}
