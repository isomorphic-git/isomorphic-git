import { GitObject } from 'models/GitObject'
import { shasum } from 'utils/shasum'

export async function hashObject({
  type,
  object,
  format = 'content',
  oid = undefined,
}) {
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object })
    }
    oid = await shasum(object)
  }
  return { oid, object }
}
