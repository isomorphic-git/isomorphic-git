import GitCommit from '../models/GitCommit'
import GitObjectManager from '../managers/GitObjectManager'
import resolveRef from '../utils/resolveRef'

export default async function verify ({ gitdir, ref, publicKey }) {
  const oid = await resolveRef({ gitdir, ref })
  const {type, object} = await GitObjectManager.read({ gitdir, oid })
  if (type !== 'commit') throw new Error(`git.verify() was expecting a ref type 'commit' but got type '${type}'`)
  let commit = GitCommit.from(object)
  let verified = await commit.verifySignature(publicKey)
  console.log('verified =', verified)
  return verified
}
