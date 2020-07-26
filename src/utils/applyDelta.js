import { InternalError } from '../errors/InternalError.js'
import { BufferCursor } from '../utils/BufferCursor.js'
import { readVarIntLE } from '../utils/varIntLE.js'

/**
 * @param {Buffer} delta
 * @param {Buffer} base
 * @returns {Buffer}
 */
export function applyDelta(delta, base) {
  // console.log(`DELTA SIZE: ${delta.byteLength}`)
  const reader = new BufferCursor(delta)
  const readUInt8 = reader.readUInt8.bind(reader)
  const baseSize = readVarIntLE(readUInt8)

  if (baseSize !== base.byteLength) {
    throw new InternalError(
      `applyDelta expected base buffer to be ${baseSize} bytes but the provided buffer was ${base.length} bytes`
    )
  }
  const objectSize = readVarIntLE(readUInt8)
  let object

  const firstOp = readOp(reader, base)
  // Speed optimization - return raw buffer if it's just single simple copy
  if (firstOp.byteLength === objectSize) {
    object = firstOp
  } else {
    // Otherwise, allocate a fresh buffer and slices
    object = Buffer.alloc(objectSize)
    const writer = new BufferCursor(object)
    writer.copy(firstOp)

    while (!reader.eof()) {
      const op = readOp(reader, base)
      writer.copy(op)
    }

    const tell = writer.tell()
    if (objectSize !== tell) {
      throw new InternalError(
        `applyDelta expected object buffer to be ${objectSize} bytes but the resulting buffer was ${tell} bytes`
      )
    }
  }
  return object
}

function readCompactLE(reader, flags, size) {
  let result = 0
  let shift = 0
  while (size--) {
    if (flags & 0b00000001) {
      result |= reader.readUInt8() << shift
    }
    flags >>= 1
    shift += 8
  }
  return result
}

function readOp(reader, base) {
  /** @type {number} */
  const byte = reader.readUInt8()
  const COPY = 0b10000000
  const OFFS = 0b00001111
  const SIZE = 0b01110000
  if (byte & COPY) {
    // copy consists of 4 byte offset, 3 byte size (in LE order)
    const offset = readCompactLE(reader, byte & OFFS, 4)
    let size = readCompactLE(reader, (byte & SIZE) >> 4, 3)
    // Yup. They really did this optimization.
    if (size === 0) size = 0x10000
    // console.log('offset', offset, 'size', size)
    const slice = base.slice(offset, offset + size)
    // console.log('copy', slice.toString('utf8'))
    return slice
  } else {
    // insert
    const insert = reader.slice(byte)
    // console.log('insert', insert.toString('utf8'))
    return insert
  }
}
