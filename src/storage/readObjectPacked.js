import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'

export async function readObjectPacked ({
  fs: _fs,
  gitdir,
  oid,
  format = 'content',
  getExternalRefDelta
}) {
  const fs = new FileSystem(_fs)
  // Check to see if it's in a packfile.
  // Iterate through all the .idx files
  let list = await fs.readdir(join(gitdir, 'objects/pack'))
  list = list.filter(x => x.endsWith('.idx'))
  for (let filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`
    let p = await readPackIndex({
      fs,
      filename: indexFile,
      getExternalRefDelta
    })
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // If the packfile DOES have the oid we're looking for...
    if (p.offsets.has(oid)) {
      // Get the resolved git object from the packfile
      if (!p.pack) {
        const packFile = indexFile.replace(/idx$/, 'pack')
        p.pack = fs.read(packFile)
      }
      let result = await p.read({ oid, getExternalRefDelta })
      result.format = 'content'
      result.source = `objects/pack/${filename.replace(/idx$/, 'pack')}`
      return result
    }
  }
  // Failed to find it
  return null
}
