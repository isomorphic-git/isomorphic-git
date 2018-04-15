import path from 'path'

import { GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, SignedGitCommit } from '../models'

export async function sign ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  privateKeys
}) {
  const fs = new FileSystem(_fs)
  const oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  const { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
  if (type !== 'commit') {
    throw new Error(
      `HEAD is not pointing to a 'commit' object but a '${type}' object`
    )
  }
  let commit = SignedGitCommit.from(object)
  commit = await commit.sign(privateKeys)
  const newOid = await GitObjectManager.write({
    fs,
    gitdir,
    type: 'commit',
    object: commit.toObject()
  })
  // Update branch pointer
  // TODO: Use an updateBranch function instead of this.
  const branch = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: 'HEAD',
    depth: 2
  })
  await fs.write(path.join(gitdir, branch), newOid + '\n')

  let commitDescription = { oid: newOid, ...commit.parse() }
  commitDescription.payload = commit.withoutSignature()
  return commitDescription
}
