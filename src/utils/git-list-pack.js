// My version of git-list-pack - roughly 15x faster than the original
// It's used slightly differently - instead of returning a through stream it wraps a stream.
// (I tried to make it API identical, but that ended up being 2x slower than this version.)
import pako from 'pako'

import { InternalError } from '../errors/InternalError.js'
import { StreamReader } from '../utils/StreamReader.js'

export async function listpack(stream, onData) {
  const reader = new StreamReader(stream)
  let PACK = await reader.read(4)
  PACK = PACK.toString('utf8')
  if (PACK !== 'PACK') {
    throw new InternalError(`Invalid PACK header '${PACK}'`)
  }

  let version = await reader.read(4)
  version = version.readUInt32BE(0)
  if (version !== 2) {
    throw new InternalError(`Invalid packfile version: ${version}`)
  }

  let numObjects = await reader.read(4)
  numObjects = numObjects.readUInt32BE(0)
  // If (for some godforsaken reason) this is an empty packfile, abort now.
  if (numObjects < 1) return

  while (!reader.eof() && numObjects--) {
    const offset = reader.tell()
    const { type, length, ofs, reference } = await parseHeader(reader)
    const inflator = new pako.Inflate()
    while (!inflator.result) {
      const chunk = await reader.chunk()
      if (!chunk) break
      inflator.push(chunk, false)
      if (inflator.err) {
        throw new InternalError(`Pako error: ${inflator.msg}`)
      }
      if (inflator.result) {
        if (inflator.result.length !== length) {
          throw new InternalError(
            `Inflated object size is different from that stated in packfile.`
          )
        }

        // Backtrack parser to where deflated data ends
        await reader.undo()
        await reader.read(chunk.length - inflator.strm.avail_in)
        const end = reader.tell()
        await onData({
          data: inflator.result,
          type,
          num: numObjects,
          offset,
          end,
          reference,
          ofs,
        })
      }
    }
  }
}

async function parseHeader(reader) {
  // Object type is encoded in bits 654
  let byte = await reader.byte()
  const type = (byte >> 4) & 0b111
  // The length encoding get complicated.
  // Last four bits of length is encoded in bits 3210
  let length = byte & 0b1111
  // Whether the next byte is part of the variable-length encoded number
  // is encoded in bit 7
  if (byte & 0b10000000) {
    let shift = 4
    do {
      byte = await reader.byte()
      length |= (byte & 0b01111111) << shift
      shift += 7
    } while (byte & 0b10000000)
  }
  // Handle deltified objects
  let ofs
  let reference
  if (type === 6) {
    let shift = 0
    ofs = 0
    const bytes = []
    do {
      byte = await reader.byte()
      ofs |= (byte & 0b01111111) << shift
      shift += 7
      bytes.push(byte)
    } while (byte & 0b10000000)
    reference = Buffer.from(bytes)
  }
  if (type === 7) {
    const buf = await reader.read(20)
    reference = buf
  }
  return { type, length, ofs, reference }
}
