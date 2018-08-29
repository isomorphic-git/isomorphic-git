import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { PackfileCache, loadPack } from '../storage/PackfileCache.js'

export async function readObjectPacked ({ fs: _fs, gitdir, oid, format = 'content', getExternalRefDelta }) {
  const fs = new FileSystem(_fs)
  // Check to see if it's in a packfile.
  // Iterate through all the .pack files
  let list = await fs.readdir(path.join(gitdir, '/objects/pack'))
  list = list.filter(x => x.endsWith('.pack'))
  for (let filename of list) {
    // Try to get the packfile from the in-memory cache
    let p = PackfileCache.get(filename)
    const packFile = `${gitdir}/objects/pack/${filename}`
    if (!p) {
      p = loadPack(fs, packFile, getExternalRefDelta)
      PackfileCache.set(filename, p)
    }
    // If the packfile DOES have the oid we're looking for...
    p = await p
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    if (p.offsets.has(oid)) {
      // Get the resolved git object from the packfile
      if (!p.pack) {
        p.pack = fs.read(packFile)
      }
      let result = await p.read({ oid, getExternalRefDelta })
      result.format = 'content'
      result.source = `objects/pack/${filename}`
      return result
    }
  }
  // Failed to find it
  return null
}
