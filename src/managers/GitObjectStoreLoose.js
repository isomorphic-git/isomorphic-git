import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'

export async function read ({ fs: _fs, gitdir, oid }) {
  const fs = new FileSystem(_fs)
  let source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  let file = await fs.read(`${gitdir}/${source}`)
  if (!file) {
    return null
  }
  return { object: file, format: 'deflated', source }
}

export async function expandOid ({ fs: _fs, gitdir, oid: short }) {
  const fs = new FileSystem(_fs)
  const prefix = short.slice(0, 2)
  const objectsSuffixes = await fs.readdir(`${gitdir}/objects/${prefix}`)
  return objectsSuffixes
    .map((suffix) => `${prefix}${suffix}`)
    .filter((_oid) => _oid.startsWith(short))
}

export async function write ({ fs: _fs, gitdir, type, object, format, oid }) {
  const fs = new FileSystem(_fs)
  if (format !== 'deflated') {
    throw new GitError(E.InternalFail, {
      message: 'GitObjectStoreLoose expects objects to write to be in deflated format'
    })
  }
  let source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  let filepath = `${gitdir}/${source}`
  // Don't overwrite existing git objects - this helps avoid EPERM errors.
  // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
  // on read?
  if (!await fs.exists(filepath)) await fs.write(filepath, object)
}
