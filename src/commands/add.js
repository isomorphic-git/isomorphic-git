import fs from 'fs'
import path from 'path'
import pify from 'pify'
import GitIndexManager from '../managers/GitIndexManager'
import GitObject from '../models/GitObject'
import read from '../utils/read'

const lstat = pify(fs.lstat)

export default async function add ({gitdir, workdir, filepath}) {
  const type = 'blob'
  const object = await read(path.join(workdir, filepath))
  const oid = await GitObject.write({gitdir, type, object})
  const index = await GitIndexManager.acquire(`${gitdir}/index`)
  let stats = await lstat(path.join(workdir, filepath))
  index.insert({filepath, stats, oid})
  await GitIndexManager.release(`${gitdir}/index`)
  return // TODO: return oid?
}