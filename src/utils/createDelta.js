import { BufferCursor } from '../utils/BufferCursor.js'
import { INDEX_CHUNK_SIZE, indexDelta } from '../utils/indexDelta.js'
import { writeVarIntLE } from '../utils/varIntLE.js'

/**
 * @param {Buffer} object
 * @param {Buffer} base
 * @returns {Buffer}
 */
export function createDelta(object, base) {
  const reader = new BufferCursor(object)
  const index = indexDelta(base)

  // We can switch to chunks of 6 bytes stored in 64bit floats (using 53 bits for integer)
  // instead of chunks of 16 bytes stored as 32 byte strings
  // - 32 byte key + 8 byte index = 48 bytes per 16 bytes
  // vs
  // - 3 * 8 byte keys + 8 byte index = 32 bytes per 18 bytes
  let needle = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
  let bestStart
  let insertBuffer = ''
  const ops = []

  // Write object size and base size
  const headerBytes = []
  const writeUInt8 = byte => headerBytes.push(byte)
  writeVarIntLE(writeUInt8, base.byteLength)
  writeVarIntLE(writeUInt8, object.byteLength)
  ops.push(Buffer.from(headerBytes))

  // Compute and write copy & insert operations
  while (!reader.eof()) {
    const locations = index.get(needle)
    // If there's a match in base for the last INDEX_CHUNK_SIZE bytes in object we've scanned...
    if (locations) {
      let bestLength = -1
      console.log('locations', locations)
      // Scan forwards
      const objectStart = reader.tell()
      for (const location of locations) {
        let i = objectStart
        let j = (location + 1) * INDEX_CHUNK_SIZE
        const baseStart = j
        // TODO: Use .getUint32 to compare 4 bytes at a time?
        while (i < object.length && j < base.length && object[i] === base[j]) {
          i++
          j++
        }
        if (bestLength === -1 || i - objectStart > bestLength) {
          bestLength = i - objectStart
          bestStart = baseStart
        }
      }
      // TODO: Scan backwards
      // Push insert operation
      writeInsertOp(ops, insertBuffer)
      insertBuffer = ''
      // Push copy operation
      console.log('bestLength', bestLength)
      writeCopyOp(
        ops,
        bestStart - INDEX_CHUNK_SIZE,
        bestLength + INDEX_CHUNK_SIZE
      )
      console.log(`bestLength = ${bestLength}`)
      reader.seek(objectStart + bestLength)
      needle = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
    } else {
      // Accumulate byte to the insertion buffer
      insertBuffer += needle.slice(0, 2)
      needle = needle.slice(2) + reader.slice(1).toString('hex')
      if (insertBuffer.length === 127 * 2) {
        // Push insert operation
        writeInsertOp(ops, insertBuffer)
        insertBuffer = ''
      }
    }
  }
  if (needle || insertBuffer) {
    insertBuffer += needle
    writeInsertOp(ops, insertBuffer)
  }
  console.log('ops', ops.map(op => op.toString('utf8')))
  return Buffer.concat(ops)
}

function writeInsertOp(ops, hex) {
  ops.push(Buffer.from([hex.length / 2]))
  ops.push(Buffer.from(hex, 'hex'))
}

// Re-using this should be safe because JS is single-threaded.
const _buffer = new DataView(new ArrayBuffer(4))
function writeCopyOp(ops, offset, size) {
  console.log('size', size)
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
  ops.push(Buffer.from(bytes))
}
