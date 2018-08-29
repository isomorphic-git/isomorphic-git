import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { PackfileCache, loadPack } from '../storage/PackfileCache.js'

export async function expandOidPacked ({ fs: _fs, gitdir, oid: short, getExternalRefDelta }) {
  const fs = new FileSystem(_fs)
  // Iterate through all the .pack files
  let results = []
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
    p = await p
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // Search through the list of oids in the packfile
    for (let oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid)
    }
  }
  return results
}
