import { FileSystem } from '../models/FileSystem.js'

export async function expandOidLoose ({ fs: _fs, gitdir, oid: short }) {
  const fs = new FileSystem(_fs)
  const prefix = short.slice(0, 2)
  const objectsSuffixes = await fs.readdir(`${gitdir}/objects/${prefix}`)
  return objectsSuffixes
    .map(suffix => `${prefix}${suffix}`)
    .filter(_oid => _oid.startsWith(short))
}
