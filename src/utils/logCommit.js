import { GitObjectManager } from '../managers'
import { GitCommit } from '../models'

export async function logCommit ({ fs, gitdir, oid, signing }) {
  try {
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new Error(`Expected ${oid} to be a commit but it was a ${type}`)
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
