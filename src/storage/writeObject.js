import { GitObject } from 'models/GitObject'
import { writeObjectLoose } from 'storage/writeObjectLoose'
import { deflate } from 'utils/deflate'
import { shasum } from 'utils/shasum'

export async function _writeObject({
  fs,
  gitdir,
  type,
  object,
  format = 'content',
  oid = undefined,
  dryRun = false,
}) {
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object })
    }
    oid = await shasum(object)
    object = Buffer.from(await deflate(object))
  }
  if (!dryRun) {
    await writeObjectLoose({ fs, gitdir, object, format: 'deflated', oid })
  }
  return oid
}
