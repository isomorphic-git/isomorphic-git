import { GitAnnotatedTag } from '../models/GitAnnotatedTag.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'

export async function resolveCommit ({ fs, gitdir, oid }) {
  const { type, object } = await readObject({ fs, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveCommit({ fs, gitdir, oid })
  }
  if (type !== 'commit') {
    throw new GitError(E.ObjectTypeAssertionFail, {
      oid,
      type,
      expected: 'commit'
    })
  }
  return { commit: GitCommit.from(object), oid }
}
