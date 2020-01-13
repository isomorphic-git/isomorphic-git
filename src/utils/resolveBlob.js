import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'

export async function resolveBlob ({ fs, gitdir, oid }) {
  const { type, object } = await readObject({ fs, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveBlob({ fs, gitdir, oid })
  }
  if (type !== 'blob') {
    throw new GitError(E.ObjectTypeAssertionFail, {
      oid,
      type,
      expected: 'blob'
    })
  }
  return { oid, blob: object }
}
