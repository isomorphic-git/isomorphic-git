import fs from 'fs'
import path from 'path'
import pify from 'pify'
import GitIndexManager from '../managers/GitIndexManager'

const lstat = pify(fs.lstat)

export default async function add ({dir, filepath}) {
  const index = await GitIndexManager.acquire(`${dir}/.git/index`)
  let stats = await lstat(path.join(dir, filepath))
  index.insert(filepath, stats)
  GitIndexManager.release(`${dir}/.git/index`)
  return // TODO: return oid?
}