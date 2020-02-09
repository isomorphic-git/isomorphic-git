import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'

export async function hasObjectPacked ({
  fs: _fs,
  gitdir,
  oid,
  getExternalRefDelta
}) {
  const fs = new FileSystem(_fs)
  // Check to see if it's in a packfile.
  // Iterate through all the .idx files
  let list = await fs.readdir(join(gitdir, 'objects/pack'))
  list = list.filter(x => x.endsWith('.idx'))
  for (const filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`
    const p = await readPackIndex({
      fs,
      filename: indexFile,
      getExternalRefDelta
    })
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // If the packfile DOES have the oid we're looking for...
    if (p.offsets.has(oid)) {
      return true
    }
  }
  // Failed to find it
  return false
}
