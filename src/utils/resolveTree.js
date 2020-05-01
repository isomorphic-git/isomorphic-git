import { ObjectTypeError } from 'errors/index'
import { GitAnnotatedTag } from 'models/GitAnnotatedTag'
import { GitCommit } from 'models/GitCommit'
import { GitTree } from 'models/GitTree'
import { _readObject } from 'storage/readObject'

export async function resolveTree({ fs, gitdir, oid }) {
  // Empty tree - bypass `readObject`
  if (oid === '4b825dc642cb6eb9a060e54bf8d69288fbee4904') {
    return { tree: GitTree.from([]), oid }
  }
  const { type, object } = await _readObject({ fs, gitdir, oid })
  // Resolve annotated tag objects to whatever
  if (type === 'tag') {
    oid = GitAnnotatedTag.from(object).parse().object
    return resolveTree({ fs, gitdir, oid })
  }
  // Resolve commits to trees
  if (type === 'commit') {
    oid = GitCommit.from(object).parse().tree
    return resolveTree({ fs, gitdir, oid })
  }
  if (type !== 'tree') {
    throw new ObjectTypeError(oid, type, 'tree')
  }
  return { tree: GitTree.from(object), oid }
}
