import { InternalError } from '../errors/InternalError.js'
import { BufferCursor } from '../utils/BufferCursor.js'

/**
 * @param {Buffer} delta
 * @param {Buffer} source
 * @returns {Buffer}
 */
export function applyDelta(delta, source) {
  const reader = new BufferCursor(delta)
  const sourceSize = readVarIntLE(reader)

  if (sourceSize !== source.byteLength) {
    throw new InternalError(
      `applyDelta expected source buffer to be ${sourceSize} bytes but the provided buffer was ${source.length} bytes`
    )
  }
  const targetSize = readVarIntLE(reader)
  let target

  const firstOp = readOp(reader, source)
  // Speed optimization - return raw buffer if it's just single simple copy
  if (firstOp.byteLength === targetSize) {
    target = firstOp
  } else {
    // Otherwise, allocate a fresh buffer and slices
    target = Buffer.alloc(targetSize)
    const writer = new BufferCursor(target)
    writer.copy(firstOp)

    while (!reader.eof()) {
      writer.copy(readOp(reader, source))
    }

    const tell = writer.tell()
    if (targetSize !== tell) {
      throw new InternalError(
        `applyDelta expected target buffer to be ${targetSize} bytes but the resulting buffer was ${tell} bytes`
      )
    }
  }
  return target
}

function readVarIntLE(reader) {
  let result = 0
  let shift = 0
  let byte = null
  do {
    byte = reader.readUInt8()
    result |= (byte & 0b01111111) << shift
    shift += 7
  } while (byte & 0b10000000)
  return result
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

function readOp(reader, source) {
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
    return source.slice(offset, offset + size)
  } else {
    // insert
    return reader.slice(byte)
  }
}
