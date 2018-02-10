import pathModule from 'path'
import { FileSystem } from '../models'
import { GitConfigManager } from '../managers'

/**
 * Read and/or write to the git config file(s)
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} args.path -  The key of the git config entry.
 * @param {string} [args.value] - A value to store at that path.
 * @returns {Promise<any>} - Resolves with the config value
 *
 * If no `value` is provided, it does a read.
 * If a `value` is provided, it does a write.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 *
 * // Write config value
 * await git.config({
 *   ...repo,
 *   path: '<@user.name@>',
 *   value: '<@Mr. Test@>'
 * })
 *
 * // Read config value
 * let value = await git.config({
 *   ...repo,
 *   path: '<@user.name@>'
 * })
 * console.log(value)
 */
export async function config ({
  dir,
  gitdir = pathModule.join(dir, '.git'),
  fs: _fs,
  all = false,
  ...args
}) {
  const fs = new FileSystem(_fs)
  let { path, value } = args
  const config = await GitConfigManager.get({ fs, gitdir })
  // This carefully distinguishes between
  // 1) there is no 'value' argument (do a "get")
  // 2) there is a 'value' argument with a value of undefined (do a "set")
  // Because setting a key to undefined is how we delete entries from the ini.
  if (value === undefined && !args.hasOwnProperty('value')) {
    const value = (await all) ? config.getall(path) : config.get(path)
    return value
  } else {
    await config.set(path, value)
    await GitConfigManager.save({ fs, gitdir, config })
  }
}
