import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { _readObject as readObject } from '../storage/readObject.js'

export async function resolveBlob({ fs, cache, gitdir, oid }) {
  const { type, object } = await readObject({ fs, cache, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveBlob({ fs, cache, gitdir, oid })
  }
  if (type !== 'blob') {
    throw new ObjectTypeError(oid, type, 'blob')
  }
  return { oid, blob: new Uint8Array(object) }
}
