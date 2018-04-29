import pathModule from 'path'

import { GitConfigManager } from '../managers'
import { FileSystem } from '../models'

/**
 * Read and/or write to the git config files.
 *
 * @link https://isomorphic-git.github.io/docs/config.html
 */
export async function config ({
  dir,
  gitdir = pathModule.join(dir, '.git'),
  fs: _fs,
  all = false,
  append = false,
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
}
