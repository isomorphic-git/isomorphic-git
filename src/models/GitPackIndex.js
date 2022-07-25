import crc32 from 'crc-32'

import { InternalError } from '../errors/InternalError.js'
import { GitObject } from '../models/GitObject'
import { BufferCursor } from '../utils/BufferCursor.js'
import { applyDelta } from '../utils/applyDelta.js'
import { listpack } from '../utils/git-list-pack.js'
import { inflate } from '../utils/inflate.js'
import { shasum } from '../utils/shasum.js'

function decodeVarInt(reader) {
  const bytes = []
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
function otherVarIntDecode(reader, startWith) {
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

export class GitPackIndex {
  constructor(stuff) {
    Object.assign(this, stuff)
    this.offsetCache = {}
  }

  static async fromIdx({ idx, getExternalRefDelta }) {
    const reader = new BufferCursor(idx)
    const magic = reader.slice(4).toString('hex')
    // Check for IDX v2 magic number
    if (magic !== 'ff744f63') {
      return // undefined
    }
    const version = reader.readUInt32BE()
    if (version !== 2) {
      throw new InternalError(
        `Unable to read version ${version} packfile IDX. (Only version 2 supported)`
      )
    }
    if (idx.byteLength > 2048 * 1024 * 1024) {
      throw new InternalError(
        `To keep implementation simple, I haven't implemented the layer 5 feature needed to support packfiles > 2GB in size.`
      )
    }
    // Skip over fanout table
    reader.seek(reader.tell() + 4 * 255)
    // Get hashes
    const size = reader.readUInt32BE()
    const hashes = []
    for (let i = 0; i < size; i++) {
      const hash = reader.slice(20).toString('hex')
      hashes[i] = hash
    }
    reader.seek(reader.tell() + 4 * size)
    // Skip over CRCs
    // Get offsets
    const offsets = new Map()
    for (let i = 0; i < size; i++) {
      offsets.set(hashes[i], reader.readUInt32BE())
    }
    const packfileSha = reader.slice(20).toString('hex')
    return new GitPackIndex({
      hashes,
      crcs: {},
      offsets,
      packfileSha,
      getExternalRefDelta,
    })
  }

  static async fromPack({ pack, getExternalRefDelta, onProgress }) {
    const listpackTypes = {
      1: 'commit',
      2: 'tree',
      3: 'blob',
      4: 'tag',
      6: 'ofs-delta',
      7: 'ref-delta',
    }
    const offsetToObject = {}

    // Older packfiles do NOT use the shasum of the pack itself,
    // so it is recommended to just use whatever bytes are in the trailer.
    // Source: https://github.com/git/git/commit/1190a1acf800acdcfd7569f87ac1560e2d077414
    const packfileSha = pack.slice(-20).toString('hex')

    const hashes = []
    const crcs = {}
    const offsets = new Map()
    let totalObjectCount = null
    let lastPercent = null

    await listpack([pack], async ({ data, type, reference, offset, num }) => {
      if (totalObjectCount === null) totalObjectCount = num
      const percent = Math.floor(
        ((totalObjectCount - num) * 100) / totalObjectCount
      )
      if (percent !== lastPercent) {
        if (onProgress) {
          await onProgress({
            phase: 'Receiving objects',
            loaded: totalObjectCount - num,
            total: totalObjectCount,
          })
        }
      }
      lastPercent = percent
      // Change type from a number to a meaningful string
      type = listpackTypes[type]

      if (['commit', 'tree', 'blob', 'tag'].includes(type)) {
        offsetToObject[offset] = {
          type,
          offset,
        }
      } else if (type === 'ofs-delta') {
        offsetToObject[offset] = {
          type,
          offset,
        }
      } else if (type === 'ref-delta') {
        offsetToObject[offset] = {
          type,
          offset,
        }
      }
    })

    // We need to know the lengths of the slices to compute the CRCs.
    const offsetArray = Object.keys(offsetToObject).map(Number)
    for (const [i, start] of offsetArray.entries()) {
      const end =
        i + 1 === offsetArray.length ? pack.byteLength - 20 : offsetArray[i + 1]
      const o = offsetToObject[start]
      const crc = crc32.buf(pack.slice(start, end)) >>> 0
      o.end = end
      o.crc = crc
    }

    // We don't have the hashes yet. But we can generate them using the .readSlice function!
    const p = new GitPackIndex({
      pack: Promise.resolve(pack),
      packfileSha,
      crcs,
      hashes,
      offsets,
      getExternalRefDelta,
    })

    // Resolve deltas and compute the oids
    lastPercent = null
    let count = 0
    const objectsByDepth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (let offset in offsetToObject) {
      offset = Number(offset)
      const percent = Math.floor((count * 100) / totalObjectCount)
      if (percent !== lastPercent) {
        if (onProgress) {
          await onProgress({
            phase: 'Resolving deltas',
            loaded: count,
            total: totalObjectCount,
          })
        }
      }
      count++
      lastPercent = percent

      const o = offsetToObject[offset]
      if (o.oid) continue
      try {
        p.readDepth = 0
        p.externalReadDepth = 0
        const { type, object } = await p.readSlice({ start: offset })
        objectsByDepth[p.readDepth] += 1
        const oid = await shasum(GitObject.wrap({ type, object }))
        o.oid = oid
        hashes.push(oid)
        offsets.set(oid, offset)
        crcs[oid] = o.crc
      } catch (err) {
        continue
      }
    }

    hashes.sort()
    return p
  }

  async toBuffer() {
    const buffers = []
    const write = (str, encoding) => {
      buffers.push(Buffer.from(str, encoding))
    }
    // Write out IDX v2 magic number
    write('ff744f63', 'hex')
    // Write out version number 2
    write('00000002', 'hex')
    // Write fanout table
    const fanoutBuffer = new BufferCursor(Buffer.alloc(256 * 4))
    for (let i = 0; i < 256; i++) {
      let count = 0
      for (const hash of this.hashes) {
        if (parseInt(hash.slice(0, 2), 16) <= i) count++
      }
      fanoutBuffer.writeUInt32BE(count)
    }
    buffers.push(fanoutBuffer.buffer)
    // Write out hashes
    for (const hash of this.hashes) {
      write(hash, 'hex')
    }
    // Write out crcs
    const crcsBuffer = new BufferCursor(Buffer.alloc(this.hashes.length * 4))
    for (const hash of this.hashes) {
      crcsBuffer.writeUInt32BE(this.crcs[hash])
    }
    buffers.push(crcsBuffer.buffer)
    // Write out offsets
    const offsetsBuffer = new BufferCursor(Buffer.alloc(this.hashes.length * 4))
    for (const hash of this.hashes) {
      offsetsBuffer.writeUInt32BE(this.offsets.get(hash))
    }
    buffers.push(offsetsBuffer.buffer)
    // Write out packfile checksum
    write(this.packfileSha, 'hex')
    // Write out shasum
    const totalBuffer = Buffer.concat(buffers)
    const sha = await shasum(totalBuffer)
    const shaBuffer = Buffer.alloc(20)
    shaBuffer.write(sha, 'hex')
    return Buffer.concat([totalBuffer, shaBuffer])
  }

  async load({ pack }) {
    this.pack = pack
  }

  async unload() {
    this.pack = null
  }

  async read({ oid }) {
    if (!this.offsets.get(oid)) {
      if (this.getExternalRefDelta) {
        this.externalReadDepth++
        return this.getExternalRefDelta(oid)
      } else {
        throw new InternalError(`Could not read object ${oid} from packfile`)
      }
    }
    const start = this.offsets.get(oid)
    return this.readSlice({ start })
  }

  async readSlice({ start }) {
    if (this.offsetCache[start]) {
      return Object.assign({}, this.offsetCache[start])
    }
    this.readDepth++
    const types = {
      0b0010000: 'commit',
      0b0100000: 'tree',
      0b0110000: 'blob',
      0b1000000: 'tag',
      0b1100000: 'ofs_delta',
      0b1110000: 'ref_delta',
    }
    if (!this.pack) {
      throw new InternalError(
        'Tried to read from a GitPackIndex with no packfile loaded into memory'
      )
    }
    const raw = (await this.pack).slice(start)
    const reader = new BufferCursor(raw)
    const byte = reader.readUInt8()
    // Object type is encoded in bits 654
    const btype = byte & 0b1110000
    let type = types[btype]
    if (type === undefined) {
      throw new InternalError('Unrecognized type: 0b' + btype.toString(2))
    }
    // The length encoding get complicated.
    // Last four bits of length is encoded in bits 3210
    const lastFour = byte & 0b1111
    let length = lastFour
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    const multibyte = byte & 0b10000000
    if (multibyte) {
      length = otherVarIntDecode(reader, lastFour)
    }
    let base = null
    let object = null
    // Handle deltified objects
    if (type === 'ofs_delta') {
      const offset = decodeVarInt(reader)
      const baseOffset = start - offset
      ;({ object: base, type } = await this.readSlice({ start: baseOffset }))
    }
    if (type === 'ref_delta') {
      const oid = reader.slice(20).toString('hex')
      ;({ object: base, type } = await this.read({ oid }))
    }
    // Handle undeltified objects
    const buffer = raw.slice(reader.tell())
    object = Buffer.from(await inflate(buffer))
    // Assert that the object length is as expected.
    if (object.byteLength !== length) {
      throw new InternalError(
        `Packfile told us object would have length ${length} but it had length ${object.byteLength}`
      )
    }
    if (base) {
      object = Buffer.from(applyDelta(object, base))
    }
    // Cache the result based on depth.
    if (this.readDepth > 3) {
      // hand tuned for speed / memory usage tradeoff
      this.offsetCache[start] = { type, object }
    }
    return { type, format: 'content', object }
  }
}
