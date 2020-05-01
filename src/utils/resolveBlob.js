import { ObjectTypeError } from 'errors/ObjectTypeError'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { _readObject as readObject } from 'storage/readObject'

export async function resolveBlob({ fs, gitdir, oid }) {
  const { type, object } = await readObject({ fs, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveBlob({ fs, gitdir, oid })
  }
  if (type !== 'blob') {
    throw new ObjectTypeError(oid, type, 'blob')
  }
  return { oid, blob: new Uint8Array(object) }
}
