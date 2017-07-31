//@flow
import shasum from 'shasum'
import pako from 'pako'

export default class GitBlob {
  constructor (raw : string|buffer) {
    this._buffer = Buffer.from(raw)
  }
  static from (raw : string|buffer) {
    return new GitBlob(raw)
  }
  wrapped () {
    return Buffer.concat([Buffer.from(`blob ${this._buffer.length}\0`), this._buffer])
  }
  oid () {
    this._oid = this._oid || shasum(this.wrapped()) // memoize
    return this._oid
  }
  zipped () {
    return pako.deflate(this.wrapped())
  }
}
