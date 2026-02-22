import { InternalError } from '../errors/InternalError.js'
import { readPackIndex } from '../storage/readPackIndex.js'
import { join } from '../utils/join.js'
import { shasum } from '../utils/shasum.js'

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
      const pack = await p.pack

      // === Packfile Integrity Verification ===
      // Performance optimization: use _checksumVerified flag to verify only once per packfile
      if (!p._checksumVerified) {
        const expectedShaFromIndex = p.packfileSha

        // 1. Fast Check: Verify packfile trailer matches index record
        // Use subarray instead of slice to avoid memory copy (zero-copy for large packfiles)
        const packTrailer = pack.subarray(-20)
        const packTrailerSha = Array.from(packTrailer)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        if (packTrailerSha !== expectedShaFromIndex) {
          throw new InternalError(
            `Packfile trailer mismatch: expected ${expectedShaFromIndex}, got ${packTrailerSha}. The packfile may be corrupted.`
          )
        }

        // 2. Deep Integrity Check: Calculate actual SHA-1 of packfile payload
        // This ensures true data integrity by verifying the entire packfile content
        // Use subarray for zero-copy reading of large files
        const payload = pack.subarray(0, -20)
        const actualPayloadSha = await shasum(payload)
        if (actualPayloadSha !== expectedShaFromIndex) {
          throw new InternalError(
            `Packfile payload corrupted: calculated ${actualPayloadSha} but expected ${expectedShaFromIndex}. The packfile may have been tampered with.`
          )
        }

        // Mark as verified to prevent performance regression on subsequent reads
        p._checksumVerified = true
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
