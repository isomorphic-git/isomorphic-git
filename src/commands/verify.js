import path from 'path'

import { GitObjectManager, GitRefManager } from '../managers'
import { FileSystem, SignedGitCommit } from '../models'

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
      `'ref' is not pointing to a 'commit' object but a '${type}' object`
    )
  }
  let commit = SignedGitCommit.from(object)
  let {valid, invalid} = await commit.verify(publicKeys)
  // We do this extra mashing to guarantee that plugins return the correct output.
  // We do this extra mashing to simplify client-side logic that
  // is less interested in the values than the presence of values
  let result = {}
  if (valid && valid.length > 0) result.valid = valid
  if (invalid && invalid.length > 0) result.invalid = invalid
  return result
}
