import { BufferCursor } from '../utils/BufferCursor.js'
import { crc32 } from '../utils/crc32.js'
import { writeVarIntLE } from '../utils/varIntLE.js'

// ATTENTION: If you make `createDelta` asynchronous, be sure to update
// it to not use the shared `_insertBuffer`.
/**
 * @param {Buffer} object
 * @param {Buffer} base
 * @param {import('./indexDelta.js').DeltaIndex} deltaIndex
 * @returns {Buffer}
 */
export function createDelta(object, base, { index, chunkSize }) {
  const reader = new BufferCursor(object)

  const needle = new Uint8Array(chunkSize)
  needle.set(reader.slice(chunkSize))
  let bestStart
  const ops = []

  // Write object size and base size
  const headerBytes = []
  const writeUInt8 = byte => headerBytes.push(byte)
  writeVarIntLE(writeUInt8, base.byteLength)
  writeVarIntLE(writeUInt8, object.byteLength)
  ops.push(Buffer.from(headerBytes))

  // Compute and write copy & insert operations
  while (!reader.eof()) {
    const locations = index.get(crc32(needle))
    // If there's possible matches in base...
    let bestLength = 0
    let objectStart = reader.tell() - chunkSize
    if (locations) {
      // Scan forwards
      for (const location of locations) {
        let i = objectStart
        let j = location * chunkSize
        const baseStart = j
        // TODO: Use .getUint32 to compare 4 bytes at a time?
        while (i < object.length && j < base.length && object[i] === base[j]) {
          i++
          j++
        }
        if (i - objectStart > bestLength) {
          bestLength = i - objectStart
          bestStart = baseStart
        }
      }
    }
    if (bestLength > chunkSize - 1) {
      // Scan backwards (expands match up to chunkSize - 1)
      while (
        objectStart >= 0 &&
        bestStart >= 0 &&
        object[objectStart - 1] === base[bestStart - 1] &&
        _insertBufferLen > 0
      ) {
        objectStart--
        bestStart--
        _insertBufferLen--
        bestLength++
      }
      // Push insert operation
      writeInsertOp(ops)
      // Push copy operation
      ops.push(writeCopyOp(bestStart, bestLength))
      reader.seek(objectStart + bestLength)
      const chunk = reader.slice(chunkSize)
      if (chunk.length === chunkSize) {
        needle.set(chunk)
      } else {
        // we must have reached the end
        for (const val of chunk) {
          appendToInsertionBuffer(ops, val)
        }
      }
    } else {
      // Accumulate byte to the insertion buffer
      appendToInsertionBuffer(ops, needle[0])
      shiftNeedle(needle, reader.readUInt8())
      if (reader.eof()) {
        for (const val of needle) {
          appendToInsertionBuffer(ops, val)
        }
      }
    }
  }
  writeInsertOp(ops)
  return Buffer.concat(ops)
}

/**
 * @param {Uint8Array} needle
 * @param {number} byte
 */
function shiftNeedle(needle, byte) {
  for (let i = 1; i < needle.length; i++) {
    needle[i - 1] = needle[i]
  }
  needle[needle.length - 1] = byte
}

// Re-using this buffer should be safe because JS is single-threaded,
// and `createDelta` is synchronous.
const _insertBuffer = new Uint8Array(127)
let _insertBufferLen = 0
function appendToInsertionBuffer(ops, byte) {
  _insertBuffer[_insertBufferLen++] = byte
  // If we've reached tha maximum limit for an insertion op,
  // go ahead and insert it.
  if (_insertBufferLen === 127) {
    writeInsertOp(ops)
  }
}

function writeInsertOp(ops) {
  if (_insertBufferLen > 0) {
    ops.push(Buffer.from([_insertBufferLen]))
    ops.push(Buffer.from(_insertBuffer.slice(0, _insertBufferLen)))
    _insertBufferLen = 0
  }
}

/** @type {Buffer} Re-using this should be safe because JS is single-threaded. */
let _buffer

function writeCopyOp(offset, size) {
  // lazy-instantiate _buffer to preserve tree-shakability
  if (!_buffer) _buffer = new DataView(new ArrayBuffer(4))
  let flags = 0b10000000
  const bytes = [0]
  _buffer.setUint32(0, offset, true)
  for (let i = 0; i < 4; i++) {
    const byte = _buffer.getUint8(i)
    if (byte) {
      flags |= 1 << i
      bytes.push(byte)
    }
  }
  if (size === 0x10000) size = 0
  _buffer.setUint32(0, size, true)
  for (let i = 0; i < 3; i++) {
    const byte = _buffer.getUint8(i)
    if (byte) {
      flags |= 1 << (i + 4)
      bytes.push(byte)
    }
  }
  bytes[0] = flags
  return Buffer.from(bytes)
}
