import { InternalError } from '../errors/InternalError.js'
import { UnsafeFilepathError } from '../errors/UnsafeFilepathError.js'
import { BufferCursor } from '../utils/BufferCursor.js'
import { comparePath } from '../utils/comparePath.js'
import { normalizeStats } from '../utils/normalizeStats.js'
import { shasum } from '../utils/shasum.js'

// Extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
function parseCacheEntryFlags(bits) {
  return {
    assumeValid: Boolean(bits & 0b1000000000000000),
    extended: Boolean(bits & 0b0100000000000000),
    stage: (bits & 0b0011000000000000) >> 12,
    nameLength: bits & 0b0000111111111111,
  }
}

function renderCacheEntryFlags(entry) {
  const flags = entry.flags
  // 1-bit extended flag (must be zero in version 2)
  flags.extended = false
  // 12-bit name length if the length is less than 0xFFF; otherwise 0xFFF
  // is stored in this field.
  flags.nameLength = Math.min(Buffer.from(entry.path).length, 0xfff)
  return (
    (flags.assumeValid ? 0b1000000000000000 : 0) +
    (flags.extended ? 0b0100000000000000 : 0) +
    ((flags.stage & 0b11) << 12) +
    (flags.nameLength & 0b111111111111)
  )
}

export class GitIndex {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  constructor(entries, unmergedPaths) {
    this._dirty = false
    this._unmergedPaths = unmergedPaths || new Set()
    this._entries = entries || new Map()
  }

  _addEntry(entry) {
    if (entry.flags.stage === 0) {
      entry.stages = [entry]
      this._entries.set(entry.path, entry)
      this._unmergedPaths.delete(entry.path)
    } else {
      let existingEntry = this._entries.get(entry.path)
      if (!existingEntry) {
        this._entries.set(entry.path, entry)
        existingEntry = entry
      }
      existingEntry.stages[entry.flags.stage] = entry
      this._unmergedPaths.add(entry.path)
    }
  }

  static async from(buffer) {
    if (Buffer.isBuffer(buffer)) {
      return GitIndex.fromBuffer(buffer)
    } else if (buffer === null) {
      return new GitIndex(null)
    } else {
      throw new InternalError('invalid type passed to GitIndex.from')
    }
  }

  static async fromBuffer(buffer) {
    if (buffer.length === 0) {
      throw new InternalError('Index file is empty (.git/index)')
    }

    const index = new GitIndex()
    const reader = new BufferCursor(buffer)
    const magic = reader.toString('utf8', 4)
    if (magic !== 'DIRC') {
      throw new InternalError(`Invalid dircache magic file number: ${magic}`)
    }

    // Verify shasum after we ensured that the file has a magic number
    const shaComputed = await shasum(buffer.slice(0, -20))
    const shaClaimed = buffer.slice(-20).toString('hex')
    if (shaClaimed !== shaComputed) {
      throw new InternalError(
        `Invalid checksum in GitIndex buffer: expected ${shaClaimed} but saw ${shaComputed}`
      )
    }

    const version = reader.readUInt32BE()
    if (version !== 2) {
      throw new InternalError(`Unsupported dircache version: ${version}`)
    }
    const numEntries = reader.readUInt32BE()
    let i = 0
    while (!reader.eof() && i < numEntries) {
      const entry = {}
      entry.ctimeSeconds = reader.readUInt32BE()
      entry.ctimeNanoseconds = reader.readUInt32BE()
      entry.mtimeSeconds = reader.readUInt32BE()
      entry.mtimeNanoseconds = reader.readUInt32BE()
      entry.dev = reader.readUInt32BE()
      entry.ino = reader.readUInt32BE()
      entry.mode = reader.readUInt32BE()
      entry.uid = reader.readUInt32BE()
      entry.gid = reader.readUInt32BE()
      entry.size = reader.readUInt32BE()
      entry.oid = reader.slice(20).toString('hex')
      const flags = reader.readUInt16BE()
      entry.flags = parseCacheEntryFlags(flags)
      // TODO: handle if (version === 3 && entry.flags.extended)
      const pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
      if (pathlength < 1) {
        throw new InternalError(`Got a path length of: ${pathlength}`)
      }
      // TODO: handle pathnames larger than 12 bits
      entry.path = reader.toString('utf8', pathlength)

      // Prevent malicious paths like "..\foo"
      if (entry.path.includes('..\\') || entry.path.includes('../')) {
        throw new UnsafeFilepathError(entry.path)
      }

      // The next bit is awkward. We expect 1 to 8 null characters
      // such that the total size of the entry is a multiple of 8 bits.
      // (Hence subtract 12 bytes for the header.)
      let padding = 8 - ((reader.tell() - 12) % 8)
      if (padding === 0) padding = 8
      while (padding--) {
        const tmp = reader.readUInt8()
        if (tmp !== 0) {
          throw new InternalError(
            `Expected 1-8 null characters but got '${tmp}' after ${entry.path}`
          )
        } else if (reader.eof()) {
          throw new InternalError('Unexpected end of file')
        }
      }
      // end of awkward part
      entry.stages = []

      index._addEntry(entry)

      i++
    }
    return index
  }

  get unmergedPaths() {
    return [...this._unmergedPaths]
  }

  get entries() {
    return [...this._entries.values()].sort(comparePath)
  }

  get entriesMap() {
    return this._entries
  }

  get entriesFlat() {
    return [...this.entries].flatMap(entry => {
      return entry.stages.length > 1 ? entry.stages.filter(x => x) : entry
    })
  }

  *[Symbol.iterator]() {
    for (const entry of this.entries) {
      yield entry
    }
  }

  insert({ filepath, stats, oid, stage = 0 }) {
    if (!stats) {
      stats = {
        ctimeSeconds: 0,
        ctimeNanoseconds: 0,
        mtimeSeconds: 0,
        mtimeNanoseconds: 0,
        dev: 0,
        ino: 0,
        mode: 0,
        uid: 0,
        gid: 0,
        size: 0,
      }
    }
    stats = normalizeStats(stats)
    const bfilepath = Buffer.from(filepath)
    const entry = {
      ctimeSeconds: stats.ctimeSeconds,
      ctimeNanoseconds: stats.ctimeNanoseconds,
      mtimeSeconds: stats.mtimeSeconds,
      mtimeNanoseconds: stats.mtimeNanoseconds,
      dev: stats.dev,
      ino: stats.ino,
      // We provide a fallback value for `mode` here because not all fs
      // implementations assign it, but we use it in GitTree.
      // '100644' is for a "regular non-executable file"
      mode: stats.mode || 0o100644,
      uid: stats.uid,
      gid: stats.gid,
      size: stats.size,
      path: filepath,
      oid: oid,
      flags: {
        assumeValid: false,
        extended: false,
        stage,
        nameLength: bfilepath.length < 0xfff ? bfilepath.length : 0xfff,
      },
      stages: [],
    }

    this._addEntry(entry)

    this._dirty = true
  }

  delete({ filepath }) {
    if (this._entries.has(filepath)) {
      this._entries.delete(filepath)
    } else {
      for (const key of this._entries.keys()) {
        if (key.startsWith(filepath + '/')) {
          this._entries.delete(key)
        }
      }
    }

    if (this._unmergedPaths.has(filepath)) {
      this._unmergedPaths.delete(filepath)
    }
    this._dirty = true
  }

  clear() {
    this._entries.clear()
    this._dirty = true
  }

  has({ filepath }) {
    return this._entries.has(filepath)
  }

  render() {
    return this.entries
      .map(entry => `${entry.mode.toString(8)} ${entry.oid}    ${entry.path}`)
      .join('\n')
  }

  static async _entryToBuffer(entry) {
    const bpath = Buffer.from(entry.path)
    // the fixed length + the filename + at least one null char => align by 8
    const length = Math.ceil((62 + bpath.length + 1) / 8) * 8
    const written = Buffer.alloc(length)
    const writer = new BufferCursor(written)
    const stat = normalizeStats(entry)
    writer.writeUInt32BE(stat.ctimeSeconds)
    writer.writeUInt32BE(stat.ctimeNanoseconds)
    writer.writeUInt32BE(stat.mtimeSeconds)
    writer.writeUInt32BE(stat.mtimeNanoseconds)
    writer.writeUInt32BE(stat.dev)
    writer.writeUInt32BE(stat.ino)
    writer.writeUInt32BE(stat.mode)
    writer.writeUInt32BE(stat.uid)
    writer.writeUInt32BE(stat.gid)
    writer.writeUInt32BE(stat.size)
    writer.write(entry.oid, 20, 'hex')
    writer.writeUInt16BE(renderCacheEntryFlags(entry))
    writer.write(entry.path, bpath.length, 'utf8')
    return written
  }

  async toObject() {
    const header = Buffer.alloc(12)
    const writer = new BufferCursor(header)
    writer.write('DIRC', 4, 'utf8')
    writer.writeUInt32BE(2)
    writer.writeUInt32BE(this.entriesFlat.length)

    let entryBuffers = []
    for (const entry of this.entries) {
      entryBuffers.push(GitIndex._entryToBuffer(entry))
      if (entry.stages.length > 1) {
        for (const stage of entry.stages) {
          if (stage && stage !== entry) {
            entryBuffers.push(GitIndex._entryToBuffer(stage))
          }
        }
      }
    }
    entryBuffers = await Promise.all(entryBuffers)

    const body = Buffer.concat(entryBuffers)
    const main = Buffer.concat([header, body])
    const sum = await shasum(main)
    return Buffer.concat([main, Buffer.from(sum, 'hex')])
  }
}
