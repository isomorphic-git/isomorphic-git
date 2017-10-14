import { fs } from '../utils'
import pify from 'pify'

// Note: this function will get more interesting once we add support for
// packed-refs.
export async function listBranches ({ gitdir }) {
  let files = await pify(fs().readdir)(`${gitdir}/refs/heads`)
  return files
}
