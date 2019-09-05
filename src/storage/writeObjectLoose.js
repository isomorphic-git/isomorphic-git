import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'

export async function writeObjectLoose ({
  fs: _fs,
  gitdir,
  type,
  object,
  format,
  oid
}) {
  const fs = new FileSystem(_fs)
  if (format !== 'deflated') {
    throw new GitError(E.InternalFail, {
      message:
        'GitObjectStoreLoose expects objects to write to be in deflated format'
    })
  }
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  const filepath = `${gitdir}/${source}`
  // Don't overwrite existing git objects - this helps avoid EPERM errors.
  // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
  // on read?
  if (!(await fs.exists(filepath))) await fs.write(filepath, object)
}
