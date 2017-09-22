import fs from 'fs'
import pify from 'pify'
const unlink = pify(fs.unlink)
export async function rm (filepath) {
  try {
    await unlink(filepath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
