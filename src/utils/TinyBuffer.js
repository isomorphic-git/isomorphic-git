import { fromByteArray as toBase64, toByteArray as fromBase64 } from 'base64-js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// A minimal (and portable!) alternative to the large 'buffer' polyfill provided by Webpack.
export class TinyBuffer extends Uint8Array {
  constructor(src) {
    super(src)

    this.view = new DataView(this.buffer)
  }

  static from(src, encoding) {
    if (typeof src === 'string') {
      return new TinyBuffer(fromString(src, encoding))
    } else if (src.buffer || Array.isArray(src)) {
      return new TinyBuffer(src)
    }

    throw new Error('Unanticipated object type passed to TinyBuffer.from!!')
  }

  static concat(buffers) {
    let newLength = 0

    for (const buffer of buffers) {
      newLength += buffer.byteLength
    }

    const newBuffer = TinyBuffer.alloc(newLength)

    let i = 0

    for (const buffer of buffers) {
      newBuffer.set(buffer, i)

      i += buffer.byteLength
    }

    return newBuffer
  }

  static alloc(length) {
    const buffer = new Uint8Array(length)

    return new TinyBuffer(buffer)
  }

  static isBuffer(thing) {
    return !!thing.buffer
  }

  toString(encoding, start, end) {
    const slice = this.slice(start, end)

    switch (encoding) {
      case 'utf8': {
        return decoder.decode(slice)
      }

      case 'hex': {
        let hex = ''

        for (let i = 0; i < slice.length; i++) {
          hex += slice[i].toString(16).padStart(2, '0')
        }

        return hex
      }

      case 'base64': {
        return toBase64(slice)
      }

      default: {
        throw new Error(`Unsupported decoding ${encoding}`)
      }
    }
  }

  get length() {
    return this.byteLength
  }

  /**
   * @param {TinyBuffer} target
   * @param {number} targetStart
   * @param {number} sourceStart
   * @param {number} sourceEnd
   */
  copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
    // Node's Buffer won't throw if the source is bigger than the dest, so we mustn't either
    sourceEnd = Math.min(sourceEnd, this.length)
    sourceEnd = Math.min(sourceEnd, sourceStart + target.length - targetStart)

    const src =
      sourceStart === 0 && sourceEnd === this.length
        ? this
        : this.slice(sourceStart, sourceEnd)

    target.set(src, targetStart)
  }

  write(value, start, length, encoding) {
    if (typeof start === 'string') {
      encoding = start
      start = undefined
      length = undefined
    } else if (typeof length === 'string') {
      encoding = length
      length = undefined
    }

    let buf = fromString(value, encoding)

    if (length !== undefined) {
      buf = buf.slice(0, length)
    }

    this.set(buf, start)
  }

  readUInt8(offset) {
    return this[offset]
  }

  readUInt16BE(offset) {
    return this.view.getUint16(offset, false)
  }

  readUInt32BE(offset) {
    return this.view.getUint32(offset, false)
  }

  writeUInt8(value, offset) {
    this.view.setUint8(offset, value, false)
  }

  writeUInt16BE(value, offset) {
    this.view.setUint16(offset, value, false)
  }

  writeUInt32BE(value, offset) {
    this.view.setUint32(offset, value, false)
  }

  writeUInt32LE(value, offset) {
    this.view.setUint32(offset, value, true)
  }

  equals(another) {
    if (this === another) return true

    if (this.length !== another.length) return false

    for (let i = 0; i < this.length; i++) {
      if (this[i] !== another[i]) {
        return false
      }
    }

    return true
  }
}

/**
 *
 * @param {string} src
 * @param {string} encoding
 * @returns {Uint8Array}
 */
function fromString(src, encoding = 'utf8') {
  switch (encoding) {
    case 'utf8': {
      return encoder.encode(src)
    }

    case 'hex': {
      const view = new Uint8Array(src.length / 2)

      for (let i = 0; i < src.length; i += 2) {
        view[i / 2] = parseInt(src.substring(i, i + 2), 16)
      }

      return view
    }

    case 'base64': {
      return fromBase64(src)
    }

    default: {
      throw new Error(`Unsupported encoding ${encoding}`)
    }
  }
}
