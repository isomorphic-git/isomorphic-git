import fs from './fs'
import pify from 'pify'
export async function rm (filepath) {
  try {
    await pify(fs().unlink)(filepath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
