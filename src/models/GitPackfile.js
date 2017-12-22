import BufferCursor from 'buffercursor'
import shasum from 'shasum'
import pako from 'pako'
import applyDelta from 'git-apply-delta'
import listpack from 'git-list-pack'
import through2 from 'through2'
import crypto from 'crypto'
import { GitObject } from './GitObject'

const types = {
  0b0010000: 'commit',
  0b0100000: 'tree',
  0b0110000: 'blob',
  0b1000000: 'tag',
  0b1100000: 'ofs_delta',
  0b1110000: 'ref_delta'
}

function decodeVarInt (reader) {
  let bytes = []
  let byte = 0
  let multibyte = 0
  do {
    byte = reader.readUInt8()
    // We keep bits 6543210
    const lastSeven = byte & 0b01111111
    bytes.push(lastSeven)
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = byte & 0b10000000
  } while (multibyte)
  // Now that all the bytes are in big-endian order,
  // alternate shifting the bits left by 7 and OR-ing the next byte.
  // And... do a weird increment-by-one thing that I don't quite understand.
  return bytes.reduce((a, b) => ((a + 1) << 7) | b, -1)
}

// I'm pretty much copying this one from the git C source code,
// because it makes no sense.
function otherVarIntDecode (reader, startWith) {
  let result = startWith
  let shift = 4
  let byte = null
  do {
    byte = reader.readUInt8()
    result |= (byte & 0b01111111) << shift
    shift += 7
  } while (byte & 0b10000000)
  return result
}

// function encodeVarInt (value) {
//   let bytes = []
//   do {
//     // We keep bits 6543210 and add them to the FRONT of an array,
//     // because we are seeing them in little-endian order, but want
//     // to return them in big-endian order.
//     const lastSeven = value & 0b01111111
//     bytes.unshift(lastSeven)
//     // Shift those seven bits off the edge of a cliff.
//     // NOTE: DO THE WEIRD INCREMENT THING.
//     value = (value >>> 7) - 1
//   } while (value > 0)
//   // Now that all the bytes are in big-endian order,
//   // set the MSB on all but the last byte.
//   bytes = bytes.map(byte => byte | 0b10000000)
//   bytes[bytes.length - 1] = bytes[bytes.length - 1] & 0b01111111
//   return bytes
// }

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
  // We might also want a reverse mapping from offsets to oids for debugging.
  let reverseOffsets = new Map()
  for (let [key, value] of offsets) {
    reverseOffsets.set(value, key)
  }
  // Knowing the length of each slice isn't strictly needed, but it is
  // nice to have.
  let lengths = Array.from(offsets)
  lengths.sort((a, b) => a[1] - b[1]) // List objects in order by offset
  let sizes = new Map()
  let slices = new Map()
  for (let i = 0; i < size - 1; i++) {
    sizes.set(lengths[i][0], lengths[i + 1][1] - lengths[i][1])
    slices.set(lengths[i][0], [lengths[i][1], lengths[i + 1][1]])
  }
  slices.set(lengths[size - 1][0], [lengths[size - 1][1], undefined])
  return {
    size,
    fanout,
    hashes,
    crcs,
    offsets,
    packfileSha,
    slices,
    reverseOffsets
  }
}

// for now we'll just write it in memory.
// TODO: make a streaming version?
function writeIDX ({
  hashes,
  crcs,
  offsets,
  packfileSha
}) {
  let size = hashes.length
  let buffers = []
  let write = (str, encoding) => {
    buffers.push(Buffer.from(str, encoding))
  }
  // Write out IDX v2 magic number
  write('ff744f63', 'hex')
  // Write out version number 2
  write('00000002', 'hex')
  // Write fanout table
  let fanoutBuffer = new BufferCursor(Buffer.alloc(256 * 4))
  for (let i = 0; i < 256; i++) {
    let count = 0
    for (let hash of hashes) {
      if (parseInt(hash.slice(0, 2), 16) <= i) count++
    }
    fanoutBuffer.writeUInt32BE(count)
  }
  console.log(fanoutBuffer)
  buffers.push(fanoutBuffer.buffer)
  // Write out hashes
  for (let hash of hashes) {
    write(hash, 'hex')
  }
  // Write out crcs
  let crcsBuffer = new BufferCursor(Buffer.alloc(size * 4))
  for (let hash of hashes) {
    crcsBuffer.writeUInt32BE(crcs.get(hash))
  }
  buffers.push(crcsBuffer.buffer)
  // Write out offsets
  let offsetsBuffer = new BufferCursor(Buffer.alloc(size * 4))
  for (let hash of hashes) {
    offsetsBuffer.writeUInt32BE(offsets.get(hash))
  }
  buffers.push(offsetsBuffer.buffer)
  // Write out packfile checksum
  write(packfileSha, 'hex')
  // Write out shasum
  console.log(buffers.length)
  let totalBuffer = Buffer.concat(buffers)
  let sha = shasum(totalBuffer)
  console.log(sha)
  let shaBuffer = Buffer.alloc(20)
  shaBuffer.write(sha, 'hex')
  return Buffer.concat([totalBuffer, shaBuffer])
}

function shastream () {
  const hash = crypto.createHash('sha1')
  return {
    passThroughSha: through2(function (chunk, enc, next) {
      hash.update(chunk)
      this.push(chunk)
      next()
    }),
    digest: () => hash.digest('hex')
  }
}

/** @ignore */
export class GitPackfile {
  constructor ({
    pack,
    size,
    fanout,
    hashes,
    crcs,
    offsets,
    packfileSha,
    slices,
    reverseOffsets
  }) {
    // Compare checksums
    let shaClaimed = pack.slice(-20).toString('hex')
    if (packfileSha !== shaClaimed) {
      throw new Error(
        `Invalid packfile shasum in IDX buffer: expected ${packfileSha} but saw ${shaClaimed}`
      )
    }
    Object.assign(this, {
      pack,
      size,
      fanout,
      hashes,
      crcs,
      offsets,
      packfileSha,
      slices,
      reverseOffsets
    })
  }
  static async fromIDX ({ idx, pack }) {
    return new GitPackfile({ pack, ...parseIDX(idx) })
  }
  static async createIDX ({ packfileStream }) {
    let hashes = []
    let datas = new Map()
    let crcs = new Map()
    let offsets = new Map()
    let types = new Map()
    let reverseOffsets = new Map()
    let {passThroughSha, digest} = shastream()
    const listpackTypes = {
      1: 'commit',
      2: 'tree',
      3: 'blob',
      4: 'tag',
      6: 'ofs-delta',
      7: 'ref-delta'
    }
    await new Promise((resolve, reject) => {
      packfileStream
      .pipe(passThroughSha)
      .pipe(listpack())
      .on('data', ({ data, type, reference, offset, num }) => {
        type = listpackTypes[type]
        if (['commit', 'tree', 'blob', 'tag'].includes(type)) {
          let {oid} = GitObject.wrap({type, object: data})
          hashes.push(oid)
          datas.set(oid, data)
          types.set(oid, type)
          crcs.set(oid, 0)
          offsets.set(oid, offset)
          reverseOffsets.set(offset, oid)
        } else if (type === 'ofs-delta') {
          console.log('reference =', reference)
          let offsetAsNumber = decodeVarInt(new BufferCursor(reference))
          console.log('offsetAsNumber =', offsetAsNumber)
          let position = offset - offsetAsNumber
          let baseoid = reverseOffsets.get(position)
          console.log('baseoid =', baseoid)
          let basedata = datas.get(baseoid)
          let basetype = types.get(baseoid)
          type = basetype
          data = applyDelta(data, basedata)
          let {oid} = GitObject.wrap({type, object: data})
          hashes.push(oid)
          datas.set(oid, data)
          types.set(oid, basetype)
          crcs.set(oid, 0)
          offsets.set(oid, offset)
          reverseOffsets.set(offset, oid)
        } else if (type === 'ref-delta') {
          let baseoid = Buffer.from(reference).toString('hex')
          let basedata = datas.get(baseoid)
          let basetype = types.get(baseoid)
          type = basetype
          data = applyDelta(data, basedata)
          let {oid} = GitObject.wrap({type, object: data})
          hashes.push(oid)
          datas.set(oid, data)
          types.set(oid, basetype)
          crcs.set(oid, 0)
          offsets.set(oid, offset)
          reverseOffsets.set(offset, oid)
        }
        console.log(num, type, hashes[hashes.length - 1])
        if (num === 0) resolve()
      })
    })
    hashes.sort()
    let idx = await writeIDX({
      hashes,
      crcs,
      offsets,
      packfileSha: digest()
    })
    return idx
  }
  async writeIDX () {
    return writeIDX(this)
  }
  // NOTE:
  // Currently, the code for CREATING a pack file is in `src/commands/push.js`
  // I forget why it's there instead of here. Maybe the GitPackfile model was created after the fact?
  // anyway, look there for the inverse, e.g. how to serialize to a packfile.
  async read ({ oid } /*: {oid: string} */) {
    if (!this.slices.has(oid)) return null
    let [start, end] = this.slices.get(oid)
    return this.readSlice({ start, end })
  }
  async readSlice ({ start, end }) {
    let raw = this.pack.slice(start, end)
    let reader = new BufferCursor(raw)
    let byte = reader.readUInt8()
    // Object type is encoded in bits 654
    let btype = byte & 0b1110000
    let type = types[btype]
    if (type === undefined) {
      throw new Error('Unrecognized type: 0b' + btype.toString(2))
    }
    // The length encoding get complicated.
    // Last four bits of length is encoded in bits 3210
    let lastFour = byte & 0b1111
    let length = lastFour
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    let multibyte = byte & 0b10000000
    if (multibyte) {
      length = otherVarIntDecode(reader, lastFour)
    }
    // console.log('length =', length)
    let base = null
    let object = null
    // Handle deltified objects
    if (type === 'ofs_delta') {
      let offset = decodeVarInt(reader)
      let position = start - offset
      // console.log('base oid =', this.reverseOffsets.get(position))
      ;({ object: base, type } = await this.readSlice({ start: position }))
    }
    if (type === 'ref_delta') {
      let oid = reader.slice(20).toString('hex')
      // console.log('base oid =', oid)
      ;({ base: object, type } = await this.read({ oid }))
    }
    // Handle undeltified objects
    let buffer = raw.slice(reader.tell())
    object = Buffer.from(pako.inflate(buffer))
    // Assert that the object length is as expected.
    if (object.byteLength !== length) {
      throw new Error(
        `Packfile told us object would have length ${length} but it had length ${object.byteLength}`
      )
    }
    if (base) {
      object = applyDelta(object, base)
    }
    return { type, object }
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
