// The Buffer class is a subclass of the Uint8Array class...
export class ModdableBuffer extends Uint8Array {
  toString(format) {
    if (format === 'utf8') return String.fromArrayBuffer(this.buffer) // @@ incorrect if view is not entire buffer

    if (format === 'hex') {
      let hex = ''
      for (const byte of this) {
        if (byte < 16) hex += '0'
        hex += byte.toString(16)
      }
      return hex.toLowerCase()
    }

    throw new Error('unsupported')
  }

  static concat(buffers) {
    let size = 0
    for (const buffer of buffers) {
      size += buffer.byteLength
    }
    const result = new ModdableBuffer(size)
    let nextIndex = 0
    for (const buffer of buffers) {
      result.set(buffer, nextIndex)
      nextIndex += buffer.byteLength
    }
    return result
  }

  static from(iterable, format) {
    if (typeof iterable === 'string') {
      if (!format || format === 'utf8')
        return new ModdableBuffer(ArrayBuffer.fromString(iterable))

      if (format === 'hex') {
        if (iterable.length % 2 === 1) {
          throw new Error('Buffer.from with hex encoding should have even number of characters')
        }
        const buffer = new ModdableBuffer(iterable.length / 2)
        for (let i = 0, j = 0; i < iterable.length / 2; i++, j += 2) {
          buffer[i] = parseInt(iterable.slice(j, j + 2), 16)
        }
        return buffer
      }
    }

    if (!format) return super.from(iterable)
  }

  static isBuffer(buffer) {
    return buffer instanceof ModdableBuffer
  }

  static alloc(length) {
    return new ModdableBuffer(length)
  }

  readUInt32BE(pos) {
    if (!this.view) this.view = new DataView(this.buffer)
    return this.view.getUint32(pos)
  }

  writeUInt32BE(val, pos = 0) {
    if (!this.view) this.view = new DataView(this.buffer)
    this.view.setUint32(pos, val)
  }

  readUInt16BE(pos) {
    if (!this.view) this.view = new DataView(this.buffer)
    return this.view.getUint16(pos)
  }

  writeUInt16BE(val, pos = 0) {
    if (!this.view) this.view = new DataView(this.buffer)
    this.view.setUint16(pos, val)
  }

  readUInt8(pos) {
    return this[pos]
  }

  write(content, offset, length, encoding) {
    if (typeof offset === 'string') {
      encoding = offset
      offset = undefined
    }
    if (typeof length === 'string') {
      encoding = length
      length = undefined
    }
    if (!encoding) encoding = 'utf8'
    if (!offset) offset = 0
    if (!length) {
      length = this.length - offset
    } else {
      length = Math.min(length, this.length - offset)
    }

    const buffer = ModdableBuffer.from(content, encoding).slice(0, length)
    this.set(buffer, offset)
  }
}
