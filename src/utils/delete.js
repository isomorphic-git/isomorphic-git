import fs from 'fs'
import pify from 'pify'
const unlink = pify(fs.unlink)
export default async function (filepath) {
  try {
    await unlink(filepath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
