import { ObjectTypeError } from 'errors/ObjectTypeError'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { _readObject as readObject } from 'storage/readObject'

export async function resolveCommit({ fs, gitdir, oid }) {
  const { type, object } = await readObject({ fs, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveCommit({ fs, gitdir, oid })
  }
  if (type !== 'commit') {
    throw new ObjectTypeError(oid, type, 'commit')
  }
  return { commit: GitCommit.from(object), oid }
}
