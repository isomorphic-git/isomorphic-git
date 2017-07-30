//@flow
import path from 'path'
import pify from 'pify'
import fs from 'fs'

export async function mkdir (dirpath /*: string */) {
  try {
    await pify(fs.mkdir)(dirpath)
    return
  } catch (err) {
    // If err is null then operation succeeded!
    if (err === null) return
    // If the directory already exists, that's OK!
    if (err.code === 'EEXIST') return
    // If we got a "no such file or directory error" backup and try again.
    if (err.code === 'ENOENT') {
      let parent = path.posix.dirname(dirpath)
      // Check to see if we've gone too far
      if (parent === '.' || parent === '/' || parent === dirpath) throw err
      // Infinite recursion, what could go wrong?
      await mkdir(parent)
      await mkdir(dirpath)
    }
  }
}

export async function mkdirs (dirlist /*: string[] */) {
  return Promise.all(dirlist.map(mkdir))
}
