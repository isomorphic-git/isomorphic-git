import { InternalError } from '../errors/InternalError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'

export async function readObjectPacked({
  fs,
  cache,
  gitdir,
  oid,
  format = 'content',
  getExternalRefDelta,
}) {
  // Check to see if it's in a packfile.
  // Iterate through all the .idx files
  let list = await fs.readdir(join(gitdir, 'objects/pack'))
  list = list.filter(x => x.endsWith('.idx'))
  for (const filename of list) {
    const indexFile = `${gitdir}/objects/pack/${filename}`
    const p = await readPackIndex({
      fs,
      cache,
      filename: indexFile,
      getExternalRefDelta,
    })
    if (p.error) throw new InternalError(p.error)
    // If the packfile DOES have the oid we're looking for...
    if (p.offsets.has(oid)) {
      // Get the resolved git object from the packfile
      if (!p.pack) {
        const packFile = indexFile.replace(/idx$/, 'pack')
        p.pack = fs.read(packFile)
      }
      const result = await p.read({ oid, getExternalRefDelta })
      result.format = 'content'
      result.source = `objects/pack/${filename.replace(/idx$/, 'pack')}`
      return result
    }
  }
  // Failed to find it
  return null
}
