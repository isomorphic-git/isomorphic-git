// @flow
import { Buffer } from 'buffer'
import sortby from 'lodash/sortBy'
import BufferCursor from 'buffercursor'

/*::
import type {Stats} from 'fs'

type CacheEntry = {
  ctime: Date,
  ctimeNanoseconds?: number,
  mtime: Date,
  mtimeNanoseconds?: number,
  dev: number,
  ino: number,
  mode: number,
  uid: number,
  gid: number,
  size: number,
  oid: string,
  flags: number,
  path: string
}
*/

function parseBuffer (buffer) {
  let reader = new BufferCursor(buffer)
  let _entries /*: Map<string, CacheEntry> */ = new Map()
  let magic = reader.toString('utf8', 4)
  if (magic !== 'DIRC') {
    throw new Error(`Inavlid dircache magic file number: ${magic}`)
  }
  let version = reader.readUInt32BE()
  if (version !== 2) throw new Error(`Unsupported dircache version: ${version}`)
  let numEntries = reader.readUInt32BE()
  let i = 0
  while (!reader.eof() && i < numEntries) {
    let entry = {}
    let ctimeSeconds = reader.readUInt32BE()
    let ctimeNanoseconds = reader.readUInt32BE()
    entry.ctime = new Date(ctimeSeconds * 1000 + ctimeNanoseconds / 1000000)
    entry.ctimeNanoseconds = ctimeNanoseconds
    let mtimeSeconds = reader.readUInt32BE()
    let mtimeNanoseconds = reader.readUInt32BE()
    entry.mtime = new Date(mtimeSeconds * 1000 + mtimeNanoseconds / 1000000)
    entry.mtimeNanoseconds = mtimeNanoseconds
    entry.dev = reader.readUInt32BE()
    entry.ino = reader.readUInt32BE()
    entry.mode = reader.readUInt32BE()
    entry.uid = reader.readUInt32BE()
    entry.gid = reader.readUInt32BE()
    entry.size = reader.readUInt32BE()
    entry.oid = reader.slice(20).toString('hex')
    entry.flags = reader.readUInt16BE() // TODO: extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
    // TODO: handle if (version === 3 && entry.flags.extended)
    let pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
    if (pathlength < 1) throw new Error(`Got a path length of: ${pathlength}`)
    entry.path = reader.toString('utf8', pathlength)
    // The next bit is awkward. We expect 1 to 8 null characters
    let tmp = reader.readUInt8()
    if (tmp !== 0) {
      throw new Error(`Expected 1-8 null characters but got '${tmp}'`)
    }
    let numnull = 1
    while (!reader.eof() && reader.readUInt8() === 0 && numnull < 9) numnull++
    reader.seek(reader.tell() - 1)
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
  get entries () /*: Array<CacheEntry> */ {
    return sortby([...this._entries.values()], 'path')
  }
  * [Symbol.iterator] () {
    for (let entry of this.entries) {
      yield entry
    }
  }
  insert ({ filepath, stats, oid }) {
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
      oid: oid,
      flags: 0
    }
    this._entries.set(entry.path, entry)
    this._dirty = true
  } /*: {filepath: string, stats: Stats, oid: string } */
  delete ({ filepath } /*: {filepath: string} */) {
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
  render () {
    return this.entries
      .map(entry => `${entry.mode.toString(8)} ${entry.oid}    ${entry.path}`)
      .join('\n')
  }
  toObject () {
    let header = Buffer.alloc(12)
    let writer = new BufferCursor(header)
    writer.write('DIRC', 4, 'utf8')
    writer.writeUInt32BE(2)
    writer.writeUInt32BE(this.entries.length)
    let body = Buffer.concat(
      this.entries.map(entry => {
        // the fixed length + the filename + at least one null char => align by 8
        let length = Math.ceil((62 + entry.path.length + 1) / 8) * 8
        let written = Buffer.alloc(length)
        let writer = new BufferCursor(written)
        let ctimeMilliseconds = entry.ctime.valueOf()
        let ctimeSeconds = Math.floor(ctimeMilliseconds / 1000)
        let ctimeNanoseconds =
          entry.ctimeNanoseconds ||
          ctimeMilliseconds * 1000000 - ctimeSeconds * 1000000 * 1000
        let mtimeMilliseconds = entry.mtime.valueOf()
        let mtimeSeconds = Math.floor(mtimeMilliseconds / 1000)
        let mtimeNanoseconds =
          entry.mtimeNanoseconds ||
          mtimeMilliseconds * 1000000 - mtimeSeconds * 1000000 * 1000
        writer.writeUInt32BE(ctimeSeconds)
        writer.writeUInt32BE(ctimeNanoseconds)
        writer.writeUInt32BE(mtimeSeconds)
        writer.writeUInt32BE(mtimeNanoseconds)
        writer.writeUInt32BE(entry.dev)
        writer.writeUInt32BE(entry.ino)
        writer.writeUInt32BE(entry.mode)
        writer.writeUInt32BE(entry.uid)
        writer.writeUInt32BE(entry.gid)
        writer.writeUInt32BE(entry.size)
        writer.write(entry.oid, 20, 'hex')
        writer.writeUInt16BE(entry.flags)
        writer.write(entry.path, entry.path.length, 'utf8')
        return written
      })
    )
    return Buffer.concat([header, body])
  }
}
