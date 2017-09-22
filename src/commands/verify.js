import GitCommit from '../models/GitCommit'
import GitObjectManager from '../managers/GitObjectManager'
import { resolveRef } from '../utils/resolveRef'
import { HKP } from 'openpgp'
const HttpKeyServer = new HKP()

export async function verify ({ gitdir, ref, publicKeys }) {
  const oid = await resolveRef({ gitdir, ref })
  const { type, object } = await GitObjectManager.read({ gitdir, oid })
  if (type !== 'commit') {
    throw new Error(
      `git.verify() was expecting a ref type 'commit' but got type '${type}'`
    )
  }
  let commit = GitCommit.from(object)
  let author = commit.headers().author
  let keys = await commit.listSigningKeys()
  if (!publicKeys) {
    let keyArray = await Promise.all(
      keys.map(id => HttpKeyServer.lookup({ keyId: id }))
    )
    publicKeys = keyArray.join('\n')
  }
  let validity = await commit.verify(publicKeys)
  if (!validity) return false
  return { author, keys }
}
