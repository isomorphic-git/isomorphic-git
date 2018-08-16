import pathModule from 'path'

import { GitConfigManager } from '../managers/GitConfigManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { cores } from '../utils/plugins.js'

/**
 * Read and/or write to the git config files.
 *
 * @link https://isomorphic-git.github.io/docs/config.html
 */
export async function config (args) {
  // These arguments are not in the function signature but destructured separately
  // as a result of a bit of a design flaw that requires the un-destructured argument object
  // in order to call args.hasOwnProperty('value') later on.
  let {
    core = 'default',
    dir,
    gitdir = pathModule.join(dir, '.git'),
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
  } catch (err) {
    err.caller = 'git.config'
    throw err
  }
}
