import { fs as defaultfs, setfs } from '../utils'
import path from 'path'
import pify from 'pify'

async function test (filepath) {
  try {
    await pify(defaultfs().lstat)(path.join(filepath, '.git'))
    return true
  } catch (err) {
    return false
  }
}
// TODO: Detect base repositories?
export async function findRoot ({ filepath, fs = defaultfs() }) {
  setfs(fs)
  if (await test(filepath)) return filepath
  let parent = path.dirname(filepath)
  if (parent === filepath) throw new Error('Unable to find git root')
  return findRoot({ filepath: parent })
}
