//@flow
import sortby from 'lodash.sortby'
import remove from 'lodash.remove'
import {Buffer} from 'buffer'
import BufferCursor from 'buffercursor'

/*::
import type {Stats} from 'fs'

type CacheEntry = {
  ctime: Date,
  ctime_ns?: number,
  mtime: Date,
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
  let _entries /*: Map<string, CacheEntry> */ = new Map()
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
    while (!reader.eof() && reader.readUInt8() === 0 && numnull < 9) numnull++;
    reader.seek(reader.tell() - 1);
    // end of awkward part
    _entries.set(entry.path, entry)
    i++
  }
  
  return _entries
}

export default class GitIndex {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  constructor (index /*: any */) {
    this._dirty = false
    if (Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index)
    } else if (index === null) {
      this._entries = new Map()
    } else {
      throw new Error('invalid type passed to GitIndex constructor')
    }
  }
  static from (buffer) {
    return new GitIndex(buffer)
  }
  render () {
    return this.entries.map(entry => `${entry.mode.toString(8)} ${entry.oid.toString('hex')}    ${entry.path}`).join('\n')
  }
  toObject () {
    let header = Buffer.alloc(12)
    let writer = new BufferCursor(header)
    writer.write('DIRC', 4, 'utf8')
    writer.writeUInt32BE(2)
    writer.writeUInt32BE(this.entries.length)
    let body = Buffer.concat(this.entries.map(entry => {
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
  insert ({filepath, stats, oid} /*: {filepath: string, stats: Stats, oid: string }*/) {
    let entry = {
      ctime: stats.ctime,
      mtime: stats.mtime,
      dev: stats.dev,
      ino: stats.ino,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      size: stats.size,
      path: filepath,
      oid: Buffer.from(oid),
      flags: 0
    }
    this._entries.set(entry.path, entry)
    this._dirty = true
  }
  delete ({filepath} /*: {filepath: string} */) {
    // Note: We could optimize this code to be faster, since
    // we know that entries should already sorted by path
    // during insertion or if read from a buffer. So we could
    // simply find the first and last and splice them out.
    // That might have corner cases I'm not thinking of though.
    //
    // Note: These two cases are mutually exlusive... if its a file it's not a directory.
    // So you could optimize the operation as an if (file) removeOne else removeDir via splice
    if (this._entries.has(filepath)) {
      this._entries.delete(filepath)
    } else {
      for (let key of this._entries.keys()) {
        if (key.startsWith(filepath + '/')) {
          this._entries.delete(key)
        }
      }
    }
    this._dirty = true
  }
  get entries () /*: Array<CacheEntry> */ {
    return sortby([...this._entries.values()], 'path')
  }
  *[Symbol.iterator] () {
    for (let entry of this.entries) {
      yield entry
    }
  }
}
