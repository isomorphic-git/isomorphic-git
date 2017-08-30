//@flow
import sortby from 'lodash.sortby'
import {Buffer} from 'buffer'
import BufferCursor from 'buffercursor'

/*::
import type {Stats} from 'fs'

type CacheEntry = {
  ctime: number,
  ctime_ns?: number,
  mtime: number,
  mtime_ns?: number,
  dev: number,
  ino: number,
  mode: number,
  uid: number,
  gid: number,
  size: number,
  oid: Buffer,
  flags: number,
  path: string
}
*/

function parseBuffer (buffer) {
  let reader = new BufferCursor(buffer)
  let _entries /*: CacheEntry[] */ = []
  let magic = reader.toString('utf8', 4)
  if (magic !== 'DIRC') throw new Error(`Inavlid dircache magic file number: ${magic}`)
  let version = reader.readUInt32BE()
  if (version !== 2) throw new Error(`Unsupported dircache version: ${version}`)
  let numEntries = reader.readUInt32BE()
  let i = 0
  while (!reader.eof() && i < numEntries) {
    let entry = {}
    let ctime_s = reader.readUInt32BE()
    let ctime_ns = reader.readUInt32BE()
    entry.ctime = new Date(ctime_s * 1000 + ctime_ns / 1000000)
    entry.ctime_ns = ctime_ns
    let mtime_s = reader.readUInt32BE()
    let mtime_ns = reader.readUInt32BE()
    entry.mtime = new Date(mtime_s * 1000 + mtime_ns / 1000000)
    entry.mtime_ns = mtime_ns
    entry.dev = reader.readUInt32BE()
    entry.ino = reader.readUInt32BE()
    entry.mode = reader.readUInt32BE()
    entry.uid = reader.readUInt32BE()
    entry.gid = reader.readUInt32BE()
    entry.size = reader.readUInt32BE()
    entry.oid = reader.slice(20)
    entry.flags = reader.readUInt16BE() // TODO: extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
    // TODO: handle if (version === 3 && entry.flags.extended)
    let pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
    if (pathlength < 1) throw new Error(`Got a path length of: ${pathlength}`)
    entry.path = reader.toString('utf8', pathlength)
    // The next bit is awkward. We expect 1 to 8 null characters 
    let tmp = reader.readUInt8()
    if (tmp !== 0) throw new Error(`Expected 1-8 null characters but got '${tmp}'`)
    let numnull = 1
    while (reader.readUInt8() === 0 && numnull < 9) numnull++;
    reader.seek(reader.tell() - 1);
    // end of awkward part
    _entries.push(entry)
    i++
  }
  return _entries
}

export default class GitIndex {
  /*::
   _entries : CacheEntry[] 
   */
  constructor (index /*: any */) {
    if (Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index)
    } else if (index === null) {
      this._entries = []
    } else {
      throw new Error('invalid type passed to GitIndex constructor')
    }
  }
  static from (buffer) {
    return new GitIndex(buffer)
  }
  render () {
    return this._entries.map(entry => `${entry.mode.toString(8)} ${entry.oid.toString('hex')}    ${entry.path}`).join('\n')
  }
  toObject () {
    let header = Buffer.alloc(12)
    let writer = new BufferCursor(header)
    writer.write('DIRC', 4, 'utf8')
    writer.writeUInt32BE(2)
    writer.writeUInt32BE(this._entries.length)
    let body = Buffer.concat(this._entries.map(entry => {
      // the fixed length + the filename + at least one null char => align by 8
      let length = Math.ceil((62 + entry.path.length + 1) / 8) * 8
      let written = Buffer.alloc(length)
      let writer = new BufferCursor(written)
      let ctime_ms = entry.ctime.valueOf()
      let ctime_s = Math.floor(ctime_ms / 1000)
      let ctime_ns = entry.ctime_ns || (ctime_ms * 1000000 - ctime_s * 1000000 * 1000)
      let mtime_ms = entry.mtime.valueOf()
      let mtime_s = Math.floor(mtime_ms / 1000)
      let mtime_ns = entry.mtime_ns || (mtime_ms * 1000000 - mtime_s * 1000000 * 1000)
      writer.writeUInt32BE(ctime_s)
      writer.writeUInt32BE(ctime_ns)
      writer.writeUInt32BE(mtime_s)
      writer.writeUInt32BE(mtime_ns)
      writer.writeUInt32BE(entry.dev)
      writer.writeUInt32BE(entry.ino)
      writer.writeUInt32BE(entry.mode)
      writer.writeUInt32BE(entry.uid)
      writer.writeUInt32BE(entry.gid)
      writer.writeUInt32BE(entry.size)
      writer.copy(entry.oid, 0, 20)
      writer.writeUInt16BE(entry.flags)
      writer.write(entry.path, entry.path.length, 'utf8')
      return written
    }))
    return Buffer.concat([header, body])
  }
  insert (filename /*: string */, stats /*: Stats */) {
    let entry = {
      ctime: stats.ctime.valueOf(),
      mtime: stats.mtime.valueOf(),
      dev: stats.dev,
      ino: stats.ino,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      size: stats.size,
      path: filename,
      oid: Buffer.alloc(20),
      flags: 0
    }
    this._entries.push(entry)
    sortby(this._entries, 'path')
  }
  get entries () {
    return this._entries
  }
  *[Symbol.iterator] () {
    for (let entry of this._entries) {
      yield entry
    }
  }
}
