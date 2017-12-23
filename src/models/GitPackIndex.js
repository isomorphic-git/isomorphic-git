import BufferCursor from 'buffercursor'
import shasum from 'shasum'
import applyDelta from 'git-apply-delta'
import listpack from 'git-list-pack'
import { GitObject } from './GitObject'
import crc32 from 'crc/lib/crc32.js'
import { PassThrough } from 'stream'

function buffer2stream (buffer) {
  let stream = new PassThrough()
  stream.end(buffer)
  return stream
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

/** @ignore */
export class GitPackIndex {
  constructor (stuff) {
    Object.assign(this, stuff)
  }
  static async fromIdx (buffer) {
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
    return new GitPackIndex({
      size,
      hashes,
      crcs,
      offsets,
      packfileSha,
      slices,
      reverseOffsets
    })
  }
  static async fromPack (pack) {
    let packfileStream = buffer2stream(pack)
    let hashes = []
    let datas = new Map()
    let crcs = new Map()
    let offsets = new Map()
    let types = new Map()
    let reverseOffsets = new Map()
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
        .pipe(listpack())
        .on('data', ({ data, type, reference, offset, num }) => {
          type = listpackTypes[type]
          if (['commit', 'tree', 'blob', 'tag'].includes(type)) {
            let { oid } = GitObject.wrap({ type, object: data })
            hashes.push(oid)
            datas.set(oid, data)
            types.set(oid, type)
            offsets.set(oid, offset)
            reverseOffsets.set(offset, oid)
          } else if (type === 'ofs-delta') {
            let offsetAsNumber = decodeVarInt(new BufferCursor(reference))
            let position = offset - offsetAsNumber
            let baseoid = reverseOffsets.get(position)
            let basedata = datas.get(baseoid)
            let basetype = types.get(baseoid)
            type = basetype
            data = applyDelta(data, basedata)
            let { oid } = GitObject.wrap({ type, object: data })
            hashes.push(oid)
            datas.set(oid, data)
            types.set(oid, basetype)
            offsets.set(oid, offset)
            reverseOffsets.set(offset, oid)
          } else if (type === 'ref-delta') {
            let baseoid = Buffer.from(reference).toString('hex')
            let basedata = datas.get(baseoid)
            let basetype = types.get(baseoid)
            type = basetype
            data = applyDelta(data, basedata)
            let { oid } = GitObject.wrap({ type, object: data })
            hashes.push(oid)
            datas.set(oid, data)
            types.set(oid, basetype)
            offsets.set(oid, offset)
            reverseOffsets.set(offset, oid)
          }
          if (num === 0) resolve()
        })
    })
    // let packfileSha = shasum(Buffer.from(hashes.join(''), 'hex'))
    hashes.sort()
    // Knowing the length of each slice isn't strictly needed, but it is
    // nice to have.
    let size = hashes.length
    let lengths = Array.from(offsets)
    lengths.sort((a, b) => a[1] - b[1]) // List objects in order by offset
    let sizes = new Map()
    let slices = new Map()
    for (let i = 0; i < size - 1; i++) {
      sizes.set(lengths[i][0], lengths[i + 1][1] - lengths[i][1])
      slices.set(lengths[i][0], [lengths[i][1], lengths[i + 1][1]])
    }
    slices.set(lengths[size - 1][0], [
      lengths[size - 1][1],
      pack.byteLength - 20
    ])
    for (let hash of hashes) {
      let crc = crc32(pack.slice(...slices.get(hash)))
      crcs.set(hash, crc)
    }
    // Older packfiles do NOT use the shasum of the pack itself,
    // so it is recommended to just use whatever bytes are in the trailer.
    // Source: https://github.com/git/git/commit/1190a1acf800acdcfd7569f87ac1560e2d077414
    // let packfileSha = shasum(pack.slice(0, -20))
    let packfileSha = pack.slice(-20).toString('hex')
    return new GitPackIndex({
      size,
      hashes,
      crcs,
      offsets,
      packfileSha,
      slices,
      reverseOffsets
    })
  }
  toBuffer () {
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
      for (let hash of this.hashes) {
        if (parseInt(hash.slice(0, 2), 16) <= i) count++
      }
      fanoutBuffer.writeUInt32BE(count)
    }
    buffers.push(fanoutBuffer.buffer)
    // Write out hashes
    for (let hash of this.hashes) {
      write(hash, 'hex')
    }
    // Write out crcs
    let crcsBuffer = new BufferCursor(Buffer.alloc(this.hashes.length * 4))
    for (let hash of this.hashes) {
      crcsBuffer.writeUInt32BE(this.crcs.get(hash))
    }
    buffers.push(crcsBuffer.buffer)
    // Write out offsets
    let offsetsBuffer = new BufferCursor(Buffer.alloc(this.hashes.length * 4))
    for (let hash of this.hashes) {
      offsetsBuffer.writeUInt32BE(this.offsets.get(hash))
    }
    buffers.push(offsetsBuffer.buffer)
    // Write out packfile checksum
    write(this.packfileSha, 'hex')
    // Write out shasum
    let totalBuffer = Buffer.concat(buffers)
    let sha = shasum(totalBuffer)
    let shaBuffer = Buffer.alloc(20)
    shaBuffer.write(sha, 'hex')
    return Buffer.concat([totalBuffer, shaBuffer])
  }
}
