import fs from 'fs'
import path from 'path'
import pify from 'pify'
import GitIndexManager from '../managers/GitIndexManager'

const lstat = pify(fs.lstat)

export default async function add ({gitdir, workdir, filepath}) {
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  let stats = await lstat(path.join(workdir, filepath))
  index.insert(filepath, stats)
  GitIndexManager.release(`${gitdir}/index`)
  return // TODO: return oid?
}