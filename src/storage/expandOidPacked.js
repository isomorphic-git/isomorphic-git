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
  const results = []
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
    // Search through the list of oids in the packfile
    for (const oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid)
    }
  }
  return results
}
