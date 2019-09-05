// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Read and/or write to the git config files.
 *
 * *Caveats:*
 * - Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
 * - The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The key of the git config entry
 * @param {string} [args.value] - (Optional) A value to store at that path
 * @param {boolean} [args.all = false] - If the config file contains multiple values, return them all as an array.
 * @param {boolean} [args.append = false] - If true, will append rather than replace when setting (use with multi-valued config options).
 *
 * @returns {Promise<any>} Resolves with the config value
 *
 * @example
 * // Write config value
 * await git.config({
 *   dir: '$input((/))',
 *   path: '$input((user.name))',
 *   value: '$input((Mr. Test))'
 * })
 *
 * // Read config value
 * let value = await git.config({
 *   dir: '$input((/))',
 *   path: '$input((user.name))'
 * })
 * console.log(value)
 *
 */
export async function config (args) {
  // These arguments are not in the function signature but destructured separately
  // as a result of a bit of a design flaw that requires the un-destructured argument object
  // in order to call args.hasOwnProperty('value') later on.
  const {
    core = 'default',
    dir,
    gitdir = join(dir, '.git'),
    fs: _fs = cores.get(core).get('fs'),
    all = false,
    append = false,
    path,
    value
  } = args
  try {
    const fs = new FileSystem(_fs)
    const config = await GitConfigManager.get({ fs, gitdir })
    // This carefully distinguishes between
    // 1) there is no 'value' argument (do a "get")
    // 2) there is a 'value' argument with a value of undefined (do a "set")
    // Because setting a key to undefined is how we delete entries from the ini.
    if (
      value === undefined &&
      !Object.prototype.hasOwnProperty.call(args, 'value')
    ) {
      if (all) {
        return config.getall(path)
      } else {
        return config.get(path)
      }
    } else {
      if (append) {
        await config.append(path, value)
      } else {
        await config.set(path, value)
      }
      await GitConfigManager.save({ fs, gitdir, config })
    }
  } catch (err) {
    err.caller = 'git.config'
    throw err
  }
}
