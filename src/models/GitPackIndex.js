import crc32 from 'crc-32'
import applyDelta from 'git-apply-delta'
import * as marky from 'marky'
import pako from 'pako'

import { E, GitError } from '../models/GitError.js'
import { BufferCursor } from '../utils/BufferCursor.js'
import { listpack } from '../utils/git-list-pack.js'
import { log } from '../utils/log.js'
import { shasum } from '../utils/shasum.js'

import { GitObject } from './GitObject'

function decodeVarInt (reader) {
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

export class GitPackIndex {
  constructor (stuff) {
    Object.assign(this, stuff)
    this.offsetCache = {}
  }

  static async fromIdx ({ idx, getExternalRefDelta }) {
    marky.mark('fromIdx')
    const reader = new BufferCursor(idx)
    const magic = reader.slice(4).toString('hex')
    // Check for IDX v2 magic number
    if (magic !== 'ff744f63') {
      return // undefined
    }
    const version = reader.readUInt32BE()
    if (version !== 2) {
      throw new GitError(E.InternalFail, {
        message: `Unable to read version ${version} packfile IDX. (Only version 2 supported)`
      })
    }
    if (idx.byteLength > 2048 * 1024 * 1024) {
      throw new GitError(E.InternalFail, {
        message: `To keep implementation simple, I haven't implemented the layer 5 feature needed to support packfiles > 2GB in size.`
      })
    }
    // Skip over fanout table
    reader.seek(reader.tell() + 4 * 255)
    // Get hashes
    const size = reader.readUInt32BE()
    marky.mark('hashes')
    const hashes = []
    for (let i = 0; i < size; i++) {
      const hash = reader.slice(20).toString('hex')
      hashes[i] = hash
    }
    log(`hashes ${marky.stop('hashes').duration}`)
    reader.seek(reader.tell() + 4 * size)
    // Skip over CRCs
    marky.mark('offsets')
    // Get offsets
    const offsets = new Map()
    for (let i = 0; i < size; i++) {
      offsets.set(hashes[i], reader.readUInt32BE())
    }
    log(`offsets ${marky.stop('offsets').duration}`)
    const packfileSha = reader.slice(20).toString('hex')
    log(`fromIdx ${marky.stop('fromIdx').duration}`)
    return new GitPackIndex({
      hashes,
      crcs: {},
      offsets,
      packfileSha,
      getExternalRefDelta
    })
  }

  static async fromPack ({ pack, getExternalRefDelta, emitter, emitterPrefix }) {
    const listpackTypes = {
      1: 'commit',
      2: 'tree',
      3: 'blob',
      4: 'tag',
      6: 'ofs-delta',
      7: 'ref-delta'
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
    const times = {
      hash: 0,
      readSlice: 0,
      offsets: 0,
      crcs: 0,
      sort: 0
    }
    let histogram = {
      commit: 0,
      tree: 0,
      blob: 0,
      tag: 0,
      'ofs-delta': 0,
      'ref-delta': 0
    }
    let bytesProcessed = 0

    log('Indexing objects')
    log(
      `percent\tmilliseconds\tbytesProcessed\tcommits\ttrees\tblobs\ttags\tofs-deltas\tref-deltas`
    )
    marky.mark('total')
    marky.mark('offsets')
    marky.mark('percent')
    await listpack([pack], ({ data, type, reference, offset, num }) => {
      if (totalObjectCount === null) totalObjectCount = num
      const percent = Math.floor(
        ((totalObjectCount - num) * 100) / totalObjectCount
      )
      if (percent !== lastPercent) {
        if (emitter) {
          emitter.emit(`${emitterPrefix}progress`, {
            phase: 'Receiving objects',
            loaded: totalObjectCount - num,
            total: totalObjectCount,
            lengthComputable: true
          })
        }
        log(
          `${percent}%\t${Math.floor(
            marky.stop('percent').duration
          )}\t${bytesProcessed}\t${histogram.commit}\t${histogram.tree}\t${
            histogram.blob
          }\t${histogram.tag}\t${histogram['ofs-delta']}\t${
            histogram['ref-delta']
          }`
        )

        histogram = {
          commit: 0,
          tree: 0,
          blob: 0,
          tag: 0,
          'ofs-delta': 0,
          'ref-delta': 0
        }
        bytesProcessed = 0
        marky.mark('percent')
      }
      lastPercent = percent
      // Change type from a number to a meaningful string
      type = listpackTypes[type]

      histogram[type]++
      bytesProcessed += data.byteLength

      if (['commit', 'tree', 'blob', 'tag'].includes(type)) {
        offsetToObject[offset] = {
          type,
          offset
        }
      } else if (type === 'ofs-delta') {
        offsetToObject[offset] = {
          type,
          offset
        }
      } else if (type === 'ref-delta') {
        offsetToObject[offset] = {
          type,
          offset
        }
      }
    })
    times['offsets'] = Math.floor(marky.stop('offsets').duration)

    log('Computing CRCs')
    marky.mark('crcs')
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
    times['crcs'] = Math.floor(marky.stop('crcs').duration)

    // We don't have the hashes yet. But we can generate them using the .readSlice function!
    const p = new GitPackIndex({
      pack: Promise.resolve(pack),
      packfileSha,
      crcs,
      hashes,
      offsets,
      getExternalRefDelta
    })

    // Resolve deltas and compute the oids
    log('Resolving deltas')
    log(`percent2\tmilliseconds2\tcallsToReadSlice\tcallsToGetExternal`)
    marky.mark('percent')
    lastPercent = null
    let count = 0
    let callsToReadSlice = 0
    let callsToGetExternal = 0
    const timeByDepth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const objectsByDepth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (let offset in offsetToObject) {
      offset = Number(offset)
      const percent = Math.floor((count++ * 100) / totalObjectCount)
      if (percent !== lastPercent) {
        log(
          `${percent}%\t${Math.floor(
            marky.stop('percent').duration
          )}\t${callsToReadSlice}\t${callsToGetExternal}`
        )
        if (emitter) {
          emitter.emit(`${emitterPrefix}progress`, {
            phase: 'Resolving deltas',
            loaded: count,
            total: totalObjectCount,
            lengthComputable: true
          })
        }
        marky.mark('percent')
        callsToReadSlice = 0
        callsToGetExternal = 0
      }
      lastPercent = percent

      const o = offsetToObject[offset]
      if (o.oid) continue
      try {
        p.readDepth = 0
        p.externalReadDepth = 0
        marky.mark('readSlice')
        const { type, object } = await p.readSlice({ start: offset })
        const time = marky.stop('readSlice').duration
        times.readSlice += time
        callsToReadSlice += p.readDepth
        callsToGetExternal += p.externalReadDepth
        timeByDepth[p.readDepth] += time
        objectsByDepth[p.readDepth] += 1
        marky.mark('hash')
        const oid = await shasum(GitObject.wrap({ type, object }))
        times.hash += marky.stop('hash').duration
        o.oid = oid
        hashes.push(oid)
        offsets.set(oid, offset)
        crcs[oid] = o.crc
      } catch (err) {
        log('ERROR', err)
        continue
      }
    }

    marky.mark('sort')
    hashes.sort()
    times['sort'] = Math.floor(marky.stop('sort').duration)
    const totalElapsedTime = marky.stop('total').duration
    times.hash = Math.floor(times.hash)
    times.readSlice = Math.floor(times.readSlice)
    times.misc = Math.floor(
      Object.values(times).reduce((a, b) => a - b, totalElapsedTime)
    )
    log(Object.keys(times).join('\t'))
    log(Object.values(times).join('\t'))
    log('by depth:')
    log([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].join('\t'))
    log(objectsByDepth.slice(0, 12).join('\t'))
    log(
      timeByDepth
        .map(Math.floor)
        .slice(0, 12)
        .join('\t')
    )
    return p
  }

  async toBuffer () {
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

  async load ({ pack }) {
    this.pack = pack
  }

  async unload () {
    this.pack = null
  }

  async read ({ oid }) {
    if (!this.offsets.get(oid)) {
      if (this.getExternalRefDelta) {
        this.externalReadDepth++
        return this.getExternalRefDelta(oid)
      } else {
        throw new GitError(E.InternalFail, {
          message: `Could not read object ${oid} from packfile`
        })
      }
    }
    const start = this.offsets.get(oid)
    return this.readSlice({ start })
  }

  async readSlice ({ start }) {
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
      0b1110000: 'ref_delta'
    }
    if (!this.pack) {
      throw new GitError(E.InternalFail, {
        message:
          'Tried to read from a GitPackIndex with no packfile loaded into memory'
      })
    }
    const raw = (await this.pack).slice(start)
    const reader = new BufferCursor(raw)
    const byte = reader.readUInt8()
    // Object type is encoded in bits 654
    const btype = byte & 0b1110000
    let type = types[btype]
    if (type === undefined) {
      throw new GitError(E.InternalFail, {
        message: 'Unrecognized type: 0b' + btype.toString(2)
      })
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
    object = Buffer.from(pako.inflate(buffer))
    // Assert that the object length is as expected.
    if (object.byteLength !== length) {
      throw new GitError(E.InternalFail, {
        message: `Packfile told us object would have length ${length} but it had length ${object.byteLength}`
      })
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
