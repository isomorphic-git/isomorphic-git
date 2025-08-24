import { ObjectTypeError } from '../errors/ObjectTypeError.js'
import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { _readObject as readObject } from '../storage/readObject.js'

export async function resolveCommit({ fs, cache, gitdir, oid }) {
  const { type, object } = await readObject({ fs, cache, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveCommit({ fs, cache, gitdir, oid })
  }
  if (type !== 'commit') {
    throw new ObjectTypeError(oid, type, 'commit')
  }
  return { commit: GitCommit.from(object), oid }
}
