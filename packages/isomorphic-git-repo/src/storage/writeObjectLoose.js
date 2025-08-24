import { InternalError } from '../errors/InternalError.js'

export async function writeObjectLoose({ fs, gitdir, object, format, oid }) {
  if (format !== 'deflated') {
    throw new InternalError(
      'GitObjectStoreLoose expects objects to write to be in deflated format'
    )
  }
  const source = `objects/${oid.slice(0, 2)}/${oid.slice(2)}`
  const filepath = `${gitdir}/${source}`
  // Don't overwrite existing git objects - this helps avoid EPERM errors.
  // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
  // on read?
  if (!(await fs.exists(filepath))) await fs.write(filepath, object)
}
