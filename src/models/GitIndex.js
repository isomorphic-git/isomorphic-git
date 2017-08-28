//@flow
import {Buffer} from 'buffer'
import BufferCursor from 'buffercursor'

function parseBuffer (buffer) {
  let reader = new BufferCursor(buffer)
  let _entries = []
  let magic = reader.toString('utf8', 4)
  if (magic !== 'DIRC') throw new Error(`Inavlid dircache magic file number: ${magic}`)
  let version = reader.readUInt32BE()
  if (version !== 2) throw new Error(`Unsupported dircache version: ${version}`)
  let numEntries = reader.readUInt32BE()
  let i = 0
  while (!reader.eof() && i < numEntries) {
    let entry = {}
    entry.createdSeconds = reader.readUInt32BE()
    entry.createdNanoseconds = reader.readUInt32BE()
    entry.modifiedSeconds = reader.readUInt32BE()
    entry.modifiedNanoseconds = reader.readUInt32BE()
    entry.device = reader.readUInt32BE()
    entry.inode = reader.readUInt32BE()
    entry.mode = reader.readUInt32BE()
    entry.uid = reader.readUInt32BE()
    entry.gid = reader.readUInt32BE()
    entry.length = reader.readUInt32BE()
    entry.oid = reader.slice(20)
    entry.flags = reader.readUInt16BE() // TODO: extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
    // TODO: handle if (version === 3 && entry.flags.extended)
    entry.pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
    if (entry.pathlength < 1) throw new Error(`Got a path length of: ${entry.pathlength}`)
    entry.path = reader.toString('utf8', entry.pathlength)
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
  /* private _entries */
  constructor (index) {
    if (Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index)
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
      writer.writeUInt32BE(entry.createdSeconds)
      writer.writeUInt32BE(entry.createdNanoseconds)
      writer.writeUInt32BE(entry.modifiedSeconds)
      writer.writeUInt32BE(entry.modifiedNanoseconds)
      writer.writeUInt32BE(entry.device)
      writer.writeUInt32BE(entry.inode)
      writer.writeUInt32BE(entry.mode)
      writer.writeUInt32BE(entry.uid)
      writer.writeUInt32BE(entry.gid)
      writer.writeUInt32BE(entry.length)
      writer.copy(entry.oid, 0, 20)
      writer.writeUInt16BE(entry.flags)
      writer.write(entry.path, entry.path.length, 'utf8')
      return written
    }))
    return Buffer.concat([header, body])
  }
  entries () {
    return this._entries
  }
  *[Symbol.iterator] () {
    for (let entry of this._entries) {
      yield entry
    }
  }
}
