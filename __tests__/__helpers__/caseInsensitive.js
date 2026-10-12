/* eslint-env node, browser, jasmine, jest */

// From the call on, `fs` acts like a case-insensitive file system (the
// default on macOS and Windows) whatever the disk is: a name that differs only
// in case from an existing file or folder names that one.
export function caseInsensitive(fs) {
  for (const command of [
    '_lstat',
    '_stat',
    '_readFile',
    '_writeFile',
    '_unlink',
    '_rmdir',
  ]) {
    const original = fs[command]
    fs[command] = async (filepath, ...args) => {
      const slash = filepath.lastIndexOf('/')
      const name = filepath.slice(slash + 1).toLowerCase()
      const names = await fs._readdir(filepath.slice(0, slash)).catch(() => [])
      const match = names.find(n => n.toLowerCase() === name)
      if (match) filepath = filepath.slice(0, slash + 1) + match
      return original(filepath, ...args)
    }
  }
}
