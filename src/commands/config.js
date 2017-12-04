import { GitConfigManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

/**
 * Read and/or write to the git config file(s)
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} args.path -  The key of the git config entry.
 * @param {string} [args.value] - A value to store at that path.
 * @returns {Promise<any>} - Resolves with the config value
 *
 * If no `value` is provided, it does a read.
 * If a `value` is provided, it does a write.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 *
 * // Write config value
 * await config(repo, {
 *   path: 'user.name',
 *   value: 'Mr. Test'
 * })
 *
 * // Read config value
 * let value = await config(repo, {
 *   path: 'user.name'
 * })
 */
export async function config ({ gitdir, fs = defaultfs() }, args) {
  let { path, value } = args
  setfs(fs)
  const config = await GitConfigManager.get({ gitdir })
  // This carefully distinguishes between
  // 1) there is no 'value' argument (do a "get")
  // 2) there is a 'value' argument with a value of undefined (do a "set")
  // Because setting a key to undefined is how we delete entries from the ini.
  if (value === undefined && !args.hasOwnProperty('value')) {
    const value = await config.get(path)
    return value
  } else {
    await config.set(path, value)
    await GitConfigManager.save({ gitdir, config })
  }
}
