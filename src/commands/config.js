import { GitConfigManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

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
