import BufferCursor from 'buffercursor'
import shasum from 'shasum'

function parseIDX (buffer) {
  let reader = new BufferCursor(buffer)
  let magic = reader.slice(4).toString('hex')
  // Check for IDX v2 magic number
  if (magic !== 'ff744f63') {
    return // undefined
  }
  let version = reader.readUInt32BE()
  if (version !== 2) {
    throw new Error(
      `Unable to read version ${version} packfile IDX. (Only version 2 supported)`
    )
  }
  // Verify checksums
  let shaComputed = shasum(buffer.slice(0, -20))
  let shaClaimed = buffer.slice(-20).toString('hex')
  if (shaClaimed !== shaComputed) {
    throw new Error(
      `Invalid checksum in IDX buffer: expected ${shaClaimed} but saw ${shaComputed}`
    )
  }
  if (buffer.byteLength > 2048 * 1024 * 1024) {
    throw new Error(
      `To keep implementation simple, I haven't implemented the layer 5 feature needed to support packfiles > 2GB in size.`
    )
  }
  let fanout = []
  for (let i = 0; i < 256; i++) {
    fanout.push(reader.readUInt32BE())
  }
  let size = fanout[255]
  // For now we'll parse the whole thing. We can optimize later if we need to.
  let hashes = []
  for (let i = 0; i < size; i++) {
    hashes.push(reader.slice(20).toString('hex'))
  }
  let crcs = new Map()
  for (let i = 0; i < size; i++) {
    crcs.set(hashes[i], reader.readUInt32BE())
  }
  let offsets = new Map()
  for (let i = 0; i < size; i++) {
    offsets.set(hashes[i], reader.readUInt32BE())
  }
  let packfileSha = reader.slice(20).toString('hex')
  // This part is gratuitous, but since we lack good unzipping arbitrary streams with extra at the end in the browser...
  let lengths = Array.from(offsets)
  lengths.sort((a, b) => a[1] - b[1]) // List objects in order by offset
  let sizes = new Map()
  let slices = new Map()
  for (let i = 0; i < size - 1; i++) {
    sizes.set(lengths[i][0], lengths[i + 1][1] - lengths[i][1])
    slices.set(lengths[i][0], [lengths[i][1], lengths[i + 1][1]])
  }
  slices.set(lengths[size - 1][0], [lengths[size - 1][1], undefined])
  return { size, fanout, hashes, crcs, packfileSha, slices }
}

export class GitPackfile {
  constructor ({ size, fanout, hashes, crcs, packfileSha, slices, pack }) {
    // Compare checksums
    let shaClaimed = pack.slice(-20).toString('hex')
    if (packfileSha !== shaClaimed) {
      throw new Error(
        `Invalid packfile shasum in IDX buffer: expected ${packfileSha} but saw ${shaClaimed}`
      )
    }
    Object.assign(this, {
      size,
      fanout,
      hashes,
      crcs,
      packfileSha,
      slices,
      pack
    })
  }
  static async fromIDX ({ idx, pack }) {
    return new GitPackfile({ pack, ...parseIDX(idx) })
  }
  async read ({ oid } /*: {oid: string} */) {
    if (!this.slices.has(oid)) return null
    let raw = this.pack.slice(...this.slices.get(oid))
    console.log(raw)
    /*
    - The header is followed by number of object entries, each of
     which looks like this:

     (undeltified representation)
     n-byte type and length (3-bit type, (n-1)*7+4-bit length)
     compressed data

     (deltified representation)
     n-byte type and length (3-bit type, (n-1)*7+4-bit length)
     20-byte base object name if OBJ_REF_DELTA or a negative relative
     offset from the delta object's position in the pack if this
     is an OBJ_OFS_DELTA object
     compressed delta data

     Observation: length of each object is encoded in a variable
     length format and is not constrained to 32-bit or anything.
    */
  }
}
