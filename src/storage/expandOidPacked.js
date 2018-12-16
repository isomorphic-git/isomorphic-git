import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'

export async function expandOidPacked ({
  fs: _fs,
  gitdir,
  oid: short,
  getExternalRefDelta
}) {
  const fs = new FileSystem(_fs)
  // Iterate through all the .pack files
  let results = []
  let list = await fs.readdir(join(gitdir, '/objects/pack'))
  list = list.filter(x => x.endsWith('.idx'))
  for (let filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`
    let p = await readPackIndex({
      fs,
      filename: indexFile,
      getExternalRefDelta
    })
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // Search through the list of oids in the packfile
    for (let oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid)
    }
  }
  return results
}
