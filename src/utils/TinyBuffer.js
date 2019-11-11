import toHex from 'array-buffer-to-hex'
import { fromByteArray as toBase64, toByteArray as fromBase64 } from 'base64-js'
import fromHex from 'hex-to-array-buffer'
import { decode as toUTF8, encode as fromUTF8 } from 'isomorphic-textencoder'

// A minimal (and portable!) alternative to the large 'buffer' polyfill provided by Webpack.
export class TinyBuffer extends Uint8Array {
  constructor (src) {
    super(src)
    this.view = new DataView(this.buffer)
  }

  static from (src, encoding) {
    if (typeof src === 'string') {
      return new TinyBuffer(fromString(src, encoding))
    } else if (src.buffer || Array.isArray(src)) {
      return new TinyBuffer(src)
    }
    console.log('from src', src)
    throw new Error('Unanticipated object type passed to TinyBuffer.from!!')
  }

  static concat (buffers) {
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

  static alloc (length) {
    const buffer = new Uint8Array(length)
    return new TinyBuffer(buffer)
  }

  static isBuffer (thing) {
    return !!thing.buffer
  }

  toString (encoding, start, end) {
    const slice = this.slice(start, end)
    switch (encoding) {
      case 'utf8': {
        return toUTF8(slice)
      }
      case 'hex': {
        return toHex(slice.buffer)
      }
      case 'base64': {
        return toBase64(slice)
      }
      default: {
        throw new Error(`Unsupported decoding ${encoding}`)
      }
    }
  }

  get length () {
    return this.byteLength
  }

  /**
   * @param {TinyBuffer} target
   * @param {number} targetStart
   * @param {number} sourceStart
   * @param {number} sourceEnd
   */
  copy (target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
    // Node's Buffer won't throw if the source is bigger than the dest, so we mustn't either
    sourceEnd = Math.min(sourceEnd, this.length)
    sourceEnd = Math.min(sourceEnd, sourceStart + target.length - targetStart)
    const src =
      sourceStart === 0 && sourceEnd === this.length
        ? this
        : this.slice(sourceStart, sourceEnd)
    target.set(src, targetStart)
  }

  write (value, start, length, encoding) {
    if (typeof start === 'string') {
      encoding = start
      start = void 0
      length = void 0
    } else if (typeof length === 'string') {
      encoding = length
      length = void 0
    }
    let buf = fromString(value, encoding)
    if (length !== void 0) {
      buf = buf.slice(0, length)
    }
    this.set(buf, start)
  }

  readUInt8 (offset) {
    return this[offset]
  }

  readUInt16BE (offset) {
    return this.view.getUint16(offset, false)
  }

  readUInt32BE (offset) {
    return this.view.getUint32(offset, false)
  }

  writeUInt8 (value, offset) {
    this.view.setUint8(offset, value, false)
  }

  writeUInt16BE (value, offset) {
    this.view.setUint16(offset, value, false)
  }

  writeUInt32BE (value, offset) {
    this.view.setUint32(offset, value, false)
  }

  writeUInt32LE (value, offset) {
    this.view.setUint32(offset, value, true)
  }

  equals (another) {
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
function fromString (src, encoding = 'utf8') {
  switch (encoding) {
    case 'utf8': {
      return fromUTF8(src)
    }
    case 'hex': {
      return new Uint8Array(fromHex(src))
    }
    case 'base64': {
      return fromBase64(src)
    }
    default: {
      throw new Error(`Unsupported encoding ${encoding}`)
    }
  }
}
