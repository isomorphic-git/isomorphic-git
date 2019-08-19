import { FileSystem } from '../models/FileSystem.js'

export async function hasObjectLoose ({ fs: _fs, gitdir, oid }) {
  const fs = new FileSystem(_fs)
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  return fs.exists(`${gitdir}/${source}`)
}
