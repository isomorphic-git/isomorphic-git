// Chris Dickinson <chris@neversaw.us>
// MIT License in package.json but no LICENSE file in repo

// Modified by William Hilton - I needed to remove 'bops' dependency since it mistakenly
// assumes Buffers in Node and Uint8Array in browser when really it's always Uint8Arrays.
import { TinyBuffer } from '../utils/TinyBuffer.js'

export function applyDelta (delta, target) {
  const vi = new Decoder()
  const OFFSET_BUFFER = new TinyBuffer(4)
  const LENGTH_BUFFER = new TinyBuffer(4)

  const baseSizeInfo = { size: null, buffer: null }
  const resizedSizeInfo = { size: null, buffer: null }
  let outIdx
  let command
  let idx

  deltaHeader(delta, baseSizeInfo)
  deltaHeader(baseSizeInfo.buffer, resizedSizeInfo)

  delta = resizedSizeInfo.buffer

  idx = 0
  outIdx = 0
  const outputBuffer = new TinyBuffer(resizedSizeInfo.size)

  const len = delta.length

  while (idx < len) {
    command = delta[idx++]
    command & 0x80 ? copy() : insert()
  }

  return outputBuffer

  function copy () {
    OFFSET_BUFFER.writeUInt32LE(0, 0)
    LENGTH_BUFFER.writeUInt32LE(0, 0)

    let check = 1

    for (let x = 0; x < 4; ++x) {
      if (command & check) {
        OFFSET_BUFFER[3 - x] = delta[idx++]
      }
      check <<= 1
    }

    for (let x = 0; x < 3; ++x) {
      if (command & check) {
        LENGTH_BUFFER[3 - x] = delta[idx++]
      }
      check <<= 1
    }
    LENGTH_BUFFER[0] = 0

    const length = LENGTH_BUFFER.readUInt32BE(0) || 0x10000
    const offset = OFFSET_BUFFER.readUInt32BE(0)

    binaryCopy(target, outputBuffer, outIdx, offset, offset + length)
    outIdx += length
  }

  function insert () {
    binaryCopy(delta, outputBuffer, outIdx, idx, command + idx)
    idx += command
    outIdx += command
  }

  function deltaHeader (buf, output) {
    let idx = 0
    let size = 0

    do {
      size = vi.write(buf[idx++])
    } while (size === void 0)

    output.size = size
    output.buffer = buf.subarray(idx)
  }
}

// Chris Dickinson <chris@neversaw.us>
// MIT License in package.json but no LICENSE file, again.
class Decoder {
  constructor () {
    this.accum = []
  }

  write (byte) {
    const MSB = 0x80
    const REST = 0x7f

    this.accum.push(byte & REST)
    if (byte & MSB) return

    let out = 0
    for (var i = 0; i < this.accum.length; ++i) {
      out |= this.accum[i] << (7 * i)
    }

    this.accum = []
    return out
  }
}

// Chris Dickinson <chris@neversaw.us>
// MIT License in package.json but no LICENSE file, again. Yes, three modules.
function binaryCopy (source, target, targetStart, sourceStart, sourceEnd) {
  targetStart = arguments.length < 3 ? 0 : targetStart
  sourceStart = arguments.length < 4 ? 0 : sourceStart
  sourceEnd = arguments.length < 5 ? source.length : sourceEnd

  if (sourceEnd === sourceStart) return
  if (target.length === 0 || source.length === 0) return

  if (sourceEnd > source.length) {
    sourceEnd = source.length
  }

  if (target.length - targetStart < sourceEnd - sourceStart) {
    sourceEnd = target.length - targetStart + sourceStart
  }

  if (source.buffer !== target.buffer) {
    // fast copy
    const len = sourceEnd - sourceStart + targetStart

    for (let i = targetStart, j = sourceStart; i < len; ++i, ++j) {
      target[i] = source[j]
    }
    return
  }
  // slow copy
  // the buffers could overlap.
  var iend = sourceEnd + sourceStart
  var tmp = new Uint8Array([].slice.call(source, sourceStart, iend))
  var x = 0

  for (; sourceStart < iend; ++sourceStart, ++x) {
    target[targetStart++] = tmp[x]
  }
}
