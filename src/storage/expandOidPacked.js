import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readPack } from '../storage/readPack.js'

export async function expandOidPacked ({
  fs: _fs,
  gitdir,
  oid: short,
  getExternalRefDelta
}) {
  const fs = new FileSystem(_fs)
  // Iterate through all the .pack files
  let results = []
  let list = await fs.readdir(path.join(gitdir, '/objects/pack'))
  list = list.filter(x => x.endsWith('.pack'))
  for (let filename of list) {
    const packFile = `${gitdir}/objects/pack/${filename}`
    let p = await readPack(fs, packFile, getExternalRefDelta)
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // Search through the list of oids in the packfile
    for (let oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid)
    }
  }
  return results
}
