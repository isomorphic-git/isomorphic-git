import { E, GitError } from '../models/GitError'
import { BufferCursor } from '../utils/BufferCursor'
import { comparePath } from '../utils/comparePath'
import { shasum } from '../utils/shasum'

const MAX_UINT32 = 2 ** 32
/*::
import type {Stats} from 'fs'

type CacheEntryFlags = {
  assumeValid: boolean,
  extended: boolean,
  stage: number,
  nameLength: number
}

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
  flags: CacheEntryFlags,
  path: string
}
*/

// Extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
function parseCacheEntryFlags (bits) {
  return {
    assumeValid: Boolean(bits & 0b1000000000000000),
    extended: Boolean(bits & 0b0100000000000000),
    stage: (bits & 0b0011000000000000) >> 12,
    nameLength: bits & 0b0000111111111111
  }
}

function renderCacheEntryFlags (flags) {
  return (
    (flags.assumeValid ? 0b1000000000000000 : 0) +
    (flags.extended ? 0b0100000000000000 : 0) +
    ((flags.stage & 0b11) << 12) +
    (flags.nameLength & 0b111111111111)
  )
}

function parseBuffer (buffer) {
  // Verify shasum
  let shaComputed = shasum(buffer.slice(0, -20))
  let shaClaimed = buffer.slice(-20).toString('hex')
  if (shaClaimed !== shaComputed) {
    throw new GitError(E.InternalFail, {
      message: `Invalid checksum in GitIndex buffer: expected ${shaClaimed} but saw ${shaComputed}`
    })
  }
  let reader = new BufferCursor(buffer)
  let _entries = new Map()
  let magic = reader.toString('utf8', 4)
  if (magic !== 'DIRC') {
    throw new GitError(E.InternalFail, {
      message: `Inavlid dircache magic file number: ${magic}`
    })
  }
  let version = reader.readUInt32BE()
  if (version !== 2) {
    throw new GitError(E.InternalFail, {
      message: `Unsupported dircache version: ${version}`
    })
  }
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
    let flags = reader.readUInt16BE()
    entry.flags = parseCacheEntryFlags(flags)
    // TODO: handle if (version === 3 && entry.flags.extended)
    let pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
    if (pathlength < 1) {
      throw new GitError(E.InternalFail, {
        message: `Got a path length of: ${pathlength}`
      })
    }
    entry.path = reader.toString('utf8', pathlength)
    // The next bit is awkward. We expect 1 to 8 null characters
    let tmp = reader.readUInt8()
    if (tmp !== 0) {
      throw new GitError(E.InternalFail, {
        message: `Expected 1-8 null characters but got '${tmp}'`
      })
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

export class GitIndex {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  constructor (index) {
    this._dirty = false
    if (Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index)
    } else if (index === null) {
      this._entries = new Map()
    } else {
      throw new GitError(E.InternalFail, {
        message: 'invalid type passed to GitIndex constructor'
      })
    }
  }
  static from (buffer) {
    return new GitIndex(buffer)
  }
  get entries () {
    return [...this._entries.values()].sort(comparePath)
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
      dev: stats.dev % MAX_UINT32,
      ino: stats.ino % MAX_UINT32,
      // We provide a fallback value for `mode` here because not all fs
      // implementations assign it, but we use it in GitTree.
      // '100644' is for a "regular non-executable file"
      mode: (stats.mode || 0o100644) % MAX_UINT32,
      uid: stats.uid % MAX_UINT32,
      gid: stats.gid % MAX_UINT32,
      size: stats.size % MAX_UINT32,
      path: filepath,
      oid: oid,
      flags: {
        assumeValid: false,
        extended: false,
        stage: 0,
        nameLength: filepath.length < 0xfff ? filepath.length : 0xfff
      }
    }
    this._entries.set(entry.path, entry)
    this._dirty = true
  }
  delete ({ filepath }) {
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
  clear () {
    this._entries.clear()
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
        writer.writeUInt32BE(ctimeSeconds % MAX_UINT32)
        writer.writeUInt32BE(ctimeNanoseconds % MAX_UINT32)
        writer.writeUInt32BE(mtimeSeconds % MAX_UINT32)
        writer.writeUInt32BE(mtimeNanoseconds % MAX_UINT32)
        writer.writeUInt32BE(entry.dev % MAX_UINT32)
        writer.writeUInt32BE(entry.ino % MAX_UINT32)
        writer.writeUInt32BE(entry.mode % MAX_UINT32)
        writer.writeUInt32BE(entry.uid % MAX_UINT32)
        writer.writeUInt32BE(entry.gid % MAX_UINT32)
        writer.writeUInt32BE(entry.size % MAX_UINT32)
        writer.write(entry.oid, 20, 'hex')
        writer.writeUInt16BE(renderCacheEntryFlags(entry.flags))
        writer.write(entry.path, entry.path.length, 'utf8')
        return written
      })
    )
    let main = Buffer.concat([header, body])
    let sum = shasum(main)
    return Buffer.concat([main, Buffer.from(sum, 'hex')])
  }
}
