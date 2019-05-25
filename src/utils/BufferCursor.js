// Modeled after https://github.com/tjfontaine/node-buffercursor
// but with the goal of being much lighter weight.

import { encode, decode } from 'isomorphic-textencoder'
import hexToArrayBuffer from 'hex-to-array-buffer'
import arrayBufferToHex from 'array-buffer-to-hex'

export class BufferCursor {
  constructor (buffer) {
    this.buffer = buffer
    this._start = 0
  }
  eof () {
    return this._start >= this.buffer.length
  }
  tell () {
    return this._start
  }
  seek (n) {
    this._start = n
  }
  slice (n) {
    const r = this.buffer.slice(this._start, this._start + n)
    this._start += n
    return r
  }
  toString (enc, length) {
    const slice = buffer.slice(this._start, this._start + length)
    const r = (enc === 'hex')
      ? arrayBufferToHex(slice)
      : decode(slice)
    this._start += length
    return r
  }
  write (value, length, enc) {
    const r = this.buffer.write(value, this._start, length, enc)
    this._start += length
    return r
  }
  readUInt8 () {
    const r = this.buffer.readUInt8(this._start)
    this._start += 1
    return r
  }
  writeUInt8 (value) {
    const r = this.buffer.writeUInt8(value, this._start)
    this._start += 1
    return r
  }
  readUInt16BE () {
    const r = this.buffer.readUInt16BE(this._start)
    this._start += 2
    return r
  }
  writeUInt16BE (value) {
    const r = this.buffer.writeUInt16BE(value, this._start)
    this._start += 2
    return r
  }
  readUInt32BE () {
    const r = this.buffer.readUInt32BE(this._start)
    this._start += 4
    return r
  }
  writeUInt32BE (value) {
    const r = this.buffer.writeUInt32BE(value, this._start)
    this._start += 4
    return r
  }
}
