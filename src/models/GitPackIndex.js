import BufferCursor from 'buffercursor'
import shasum from 'shasum'
import applyDelta from 'git-apply-delta'
import listpack from 'git-list-pack'
import { GitObject } from './GitObject'
import crc32 from 'crc/lib/crc32.js'
import { PassThrough } from 'stream'
import pako from 'pako'

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
  static async fromPack ({ pack, getExternalRefDelta }) {
    const listpackTypes = {
      1: 'commit',
      2: 'tree',
      3: 'blob',
      4: 'tag',
      6: 'ofs-delta',
      7: 'ref-delta'
    }
    let packfileStream = buffer2stream(pack)
    let offsetToObject = new Map()
    let oidToObject = new Map()

    let hashes = []
    let datas = new Map()
    let crcs = new Map()
    let offsets = new Map()
    let types = new Map()
    let reverseOffsets = new Map()
    let backlog = []
    let totalObjectCount = null
    let lastPercent = null
    console.log('Indexing objects')
    await new Promise((resolve, reject) => {
      packfileStream
        .pipe(listpack())
        .on('data', async ({ data, type, reference, offset, num }) => {
          if (totalObjectCount === null) totalObjectCount = num
          let percent = Math.floor(
            (totalObjectCount - num) * 100 / totalObjectCount
          )
          if (percent !== lastPercent) console.log(`${percent}%`)
          lastPercent = percent
          // Change type from a number to a meaningful string
          type = listpackTypes[type]
          if (['commit', 'tree', 'blob', 'tag'].includes(type)) {
            offsetToObject.set(offset, {
              type,
              offset,
              data
            })
            
            // let { oid } = GitObject.wrap({ type, object: data })
            // hashes.push(oid)
            // datas.set(oid, data)
            // types.set(oid, type)
            // offsets.set(oid, offset)
            // reverseOffsets.set(offset, oid)
          } else if (type === 'ofs-delta') {
            let offsetAsNumber = decodeVarInt(new BufferCursor(reference))
            let baseOffset = offset - offsetAsNumber
            offsetToObject.set(offset, {
              type,
              offset,
              delta: data,
              baseOffset
            })
            // let baseOid = reverseOffsets.get(baseOffset)
            // let basedata = datas.get(baseOid)
            // let basetype = types.get(baseOid)
            // type = basetype
            // data = applyDelta(data, basedata)
            // let { oid } = GitObject.wrap({ type, object: data })
            // hashes.push(oid)
            // datas.set(oid, data)
            // types.set(oid, basetype)
            // offsets.set(oid, offset)
            // reverseOffsets.set(offset, oid)
          } else if (type === 'ref-delta') {
            let baseOid = Buffer.from(reference).toString('hex')
            offsetToObject.set(offset, {
              type,
              offset,
              delta: data,
              baseOid
            })
            // console.log('ref-delta', baseOid)
            // let basedata = null
            // let basetype = null
            // if (hashes.includes(baseOid)) {
            //   basedata = datas.get(baseOid)
            //   basetype = types.get(baseOid)
            // } else {
            //   ;({
            //     type: basetype,
            //     object: basedata
            //   } = await getExternalRefDelta(oid))
            // }
            // type = basetype
            // // console.log(data === undefined, basedata === undefined)
            // if (basedata !== undefined) {
            //   data = applyDelta(data, basedata)
            //   let { oid } = GitObject.wrap({ type, object: data })
            //   hashes.push(oid)
            //   datas.set(oid, data)
            //   types.set(oid, basetype)
            //   offsets.set(oid, offset)
            //   reverseOffsets.set(offset, oid)
            // } else {
            //   backlog.push({
            //     baseOid,
            //     offset,
            //     data
            //   })
            // }
          }
          if (num === 0) resolve()
        })
    })

    let oidToOffset = new Map()
    
    async function resolveDeltas (o) {
      if (o.data) {
        return
      } else {
        let base
        if (o.type === 'ofs-delta') {
          base = offsetToObject.get(o.baseOffset)
        } else if (o.type === 'ref-delta') {
          base = oidToObject.get(o.baseOid)
          if (!base) {
            let { type, object } = await getExternalRefDelta(o.baseOid)
            base = { type, data: object }
          }
        }
        await resolveDeltas(base)
        o.type = base.type
        o.data = applyDelta(o.delta, base.data)
        let { oid } = GitObject.wrap({ type: o.type, object: o.data })
        o.oid = oid
        oidToObject.set(oid, o)
      }

    }
    console.log('Resolving deltas')
    lastPercent = null
    let count = 0
    for (let [offset, o] of offsetToObject) {
      let percent = Math.floor(
        count++ * 100 / totalObjectCount
      )
      if (percent !== lastPercent) console.log(`${percent}%`)
      lastPercent = percent
      if (['commit', 'tree', 'blob', 'tag'].includes(o.type)) {
        let { oid } = GitObject.wrap({ type: o.type, object: o.data })
        o.oid = oid
        oidToObject.set(oid, o)
      } else if (o.type === 'ofs-delta') {
        await resolveDeltas(o)
      } else if (o.type === 'ref-delta') {
        await resolveDeltas(o)
      }
      offsets.set(o.oid, offset)
    }
    hashes = Array.from(oidToObject.keys())
    // if (backlog.length > 0) {
    //   throw new Error(`fatal: pack has ${backlog.length} unresolved deltas`)
    // }
    // // Finish backlog
    // while (backlog.length > 0) {
    //   console.log(backlog.length)
    //   let { baseOid, offset, data } = backlog.shift()
    //   // console.log('ref-delta', baseOid)
    //   let basedata = datas.get(baseOid)
    //   let basetype = types.get(baseOid)
    //   let type = basetype
    //   // console.log(data === undefined, basedata === undefined)
    //   if (basedata !== undefined) {
    //     data = applyDelta(data, basedata)
    //     let { oid } = GitObject.wrap({ type, object: data })
    //     hashes.push(oid)
    //     datas.set(oid, data)
    //     types.set(oid, basetype)
    //     offsets.set(oid, offset)
    //     reverseOffsets.set(offset, oid)
    //   } else {
    //     backlog.push({
    //       baseOid,
    //       data
    //     })
    //   }
    // }
    // let packfileSha = shasum(Buffer.from(hashes.join(''), 'hex'))
    hashes.sort()
    // Knowing the length of each slice isn't strictly needed, but it is
    // nice to have.
    let size = hashes.length
    let lengths = Array.from(offsets)
    lengths.sort((a, b) => a[1] - b[1]) // List objects in order by offset
    let slices = new Map()
    for (let i = 0; i < size - 1; i++) {
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
  async load ({ pack }) {
    this.pack = pack
  }
  async unload () {
    this.pack = null
  }
  async read ({ oid, getExternalRefDelta } /*: {oid: string} */) {
    if (!this.slices.has(oid)) {
      return getExternalRefDelta(oid)
    }
    let [start, end] = this.slices.get(oid)
    return this.readSlice({ start, end })
  }
  async readSlice ({ start, end }) {
    const types = {
      0b0010000: 'commit',
      0b0100000: 'tree',
      0b0110000: 'blob',
      0b1000000: 'tag',
      0b1100000: 'ofs_delta',
      0b1110000: 'ref_delta'
    }
    if (!this.pack) {
      throw new Error(
        'Tried to read from a GitPackIndex with no packfile loaded into memory'
      )
    }
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
      let baseOffset = start - offset
      // console.log('base oid =', this.reverseOffsets.get(baseOffset))
      ;({ object: base, type } = await this.readSlice({ start: baseOffset }))
    }
    if (type === 'ref_delta') {
      let oid = reader.slice(20).toString('hex')
      // console.log('base oid =', oid)
      ;({ object: base, type } = await this.read({ oid }))
    }
    // Handle undeltified objects
    let buffer = raw.slice(reader.tell())
    object = Buffer.from(pako.inflate(buffer))
    // Assert that the object length is as expected.
    if (object.byteLength !== length) {
      throw new Error(
        `Packfile told us object would have length ${length} but it had length ${
          object.byteLength
        }`
      )
    }
    if (base) {
      object = applyDelta(object, base)
    }
    return { type, object }
  }
}
