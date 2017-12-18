import path from 'path'
import { FileSystem, SignedGitCommit } from '../models'
import { GitRefManager, GitObjectManager } from '../managers'
import { HKP } from 'openpgp/dist/openpgp.min.js'
const HttpKeyServer = new HKP()

/** @ignore */
export async function verify ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  ref,
  publicKeys
}) {
  const fs = new FileSystem(_fs)
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  if (type !== 'commit') {
    throw new Error(
      `git.verify() was expecting a ref type 'commit' but got type '${type}'`
    )
  }
  let commit = SignedGitCommit.from(object)
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
