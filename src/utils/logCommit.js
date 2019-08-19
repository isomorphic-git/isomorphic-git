import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'

export async function logCommit ({ fs, gitdir, oid, signing }) {
  try {
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        oid,
        expected: 'commit',
        type
      })
    }
    const commit = GitCommit.from(object)
    const result = Object.assign({ oid }, commit.parse())
    if (signing) {
      result.payload = commit.withoutSignature()
    }
    return result
  } catch (err) {
    return {
      oid,
      error: err
    }
  }
}
