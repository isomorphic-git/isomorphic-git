import { GitObject } from 'models/GitObject'
import { shasum } from 'utils/shasum'

export async function hashObject({ gitdir, type, object }) {
  return shasum(GitObject.wrap({ type, object }))
}
