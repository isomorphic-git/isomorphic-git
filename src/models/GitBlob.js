// @flow
import { Buffer } from 'buffer'
import shasum from 'shasum'
import pako from 'pako'

export default class GitBlob {
  /*::
  _buffer : Buffer
  _oid : string
  */
  constructor (raw /*: string|Buffer */) {
    this._buffer = Buffer.from(raw)
  }
  static from (raw /*: string|Buffer */) {
    return new GitBlob(raw)
  }
  wrapped () {
    return Buffer.concat([
      Buffer.from(`blob ${this._buffer.length}\0`),
      this._buffer
    ])
  }
  oid () {
    this._oid = this._oid || shasum(this.wrapped()) // memoize
    return this._oid
  }
  zipped () {
    return pako.deflate(this.wrapped())
  }
}
