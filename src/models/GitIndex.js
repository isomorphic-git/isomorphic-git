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
    skipWorktree: false,
    intentToAdd: false,
  }
}

// Bits of the version 3 extended flags field that git understands:
// 1-bit reserved, 1-bit skip-worktree, 1-bit intent-to-add, 13 unused bits
const SKIP_WORKTREE = 0b0100000000000000
const INTENT_TO_ADD = 0b0010000000000000

function hasExtendedFlags(entry) {
  return Boolean(entry.flags.skipWorktree || entry.flags.intentToAdd)
}

function renderCacheEntryFlags(entry) {
  const flags = entry.flags
  // 1-bit extended flag, set only when the entry needs the extended
  // flags field that version 3 adds
  flags.extended = hasExtendedFlags(entry)
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

function renderCacheEntryExtendedFlags(entry) {
  return (
    (entry.flags.skipWorktree ? SKIP_WORKTREE : 0) +
    (entry.flags.intentToAdd ? INTENT_TO_ADD : 0)
  )
}

// Version 4 stores how many bytes to drop from the end of the previous path
// with the same variable width encoding as OFS_DELTA offsets in packfiles
function readVarInt(reader) {
  let byte = reader.readUInt8()
  let value = byte & 0b01111111
  while (byte & 0b10000000) {
    byte = reader.readUInt8()
    value = (value + 1) * 128 + (byte & 0b01111111)
  }
  return value
}

function encodeVarInt(value) {
  const bytes = [value & 0b01111111]
  while ((value >>>= 7)) {
    value--
    bytes.unshift(0b10000000 | (value & 0b01111111))
  }
  return Buffer.from(bytes)
}

function commonPrefixLength(a, b) {
  const length = Math.min(a.length, b.length)
  let i = 0
  while (i < length && a[i] === b[i]) i++
  return i
}

export class GitIndex {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  constructor(entries, unmergedPaths) {
    this._dirty = false
    // Version of the index file this was read from. Like git, keep writing
    // version 4 once the index uses it.
    this._version = 2
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

    // Verify shasum after we ensured that the file has a magic number.
    // An all zero checksum is not checked, like git does: that is what git
    // writes with index.skipHash (also turned on by feature.manyFiles).
    const shaClaimed = buffer.slice(-20).toString('hex')
    if (shaClaimed !== '0'.repeat(40)) {
      const shaComputed = await shasum(buffer.slice(0, -20))
      if (shaClaimed !== shaComputed) {
        throw new InternalError(
          `Invalid checksum in GitIndex buffer: expected ${shaClaimed} but saw ${shaComputed}`
        )
      }
    }

    const version = reader.readUInt32BE()
    if (version !== 2 && version !== 3 && version !== 4) {
      throw new InternalError(`Unsupported dircache version: ${version}`)
    }
    index._version = version
    const numEntries = reader.readUInt32BE()
    let previousPath = Buffer.alloc(0)
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
      if (entry.flags.extended) {
        const extendedFlags = reader.readUInt16BE()
        if (extendedFlags & ~(SKIP_WORKTREE | INTENT_TO_ADD)) {
          throw new InternalError(
            `Unknown index entry format: 0x${extendedFlags.toString(16)}`
          )
        }
        entry.flags.skipWorktree = Boolean(extendedFlags & SKIP_WORKTREE)
        entry.flags.intentToAdd = Boolean(extendedFlags & INTENT_TO_ADD)
      }
      if (version === 4) {
        // The path is the previous one with some bytes dropped from its end
        // and the NUL terminated string that follows appended to it
        const strip = readVarInt(reader)
        const length = buffer.indexOf(0, reader.tell()) - reader.tell()
        if (strip > previousPath.length || length < 0) {
          throw new InternalError(
            `Invalid path compression in index entry after ${previousPath}`
          )
        }
        previousPath = Buffer.concat([
          previousPath.slice(0, previousPath.length - strip),
          reader.slice(length),
        ])
        if (previousPath.length === 0) {
          throw new InternalError('Got a path length of: 0')
        }
        entry.path = previousPath.toString('utf8')
      } else {
        const pathlength = buffer.indexOf(0, reader.tell() + 1) - reader.tell()
        if (pathlength < 1) {
          throw new InternalError(`Got a path length of: ${pathlength}`)
        }
        // TODO: handle pathnames larger than 12 bits
        entry.path = reader.toString('utf8', pathlength)
      }

      // Prevent malicious paths like "..\foo"
      if (entry.path.includes('..\\') || entry.path.includes('../')) {
        throw new UnsafeFilepathError(entry.path)
      }

      // The next bit is awkward. We expect 1 to 8 null characters
      // such that the total size of the entry is a multiple of 8 bits.
      // (Hence subtract 12 bytes for the header.)
      // Version 4 has no padding, only the NUL that ends the path.
      let padding = version === 4 ? 1 : 8 - ((reader.tell() - 12) % 8)
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
    // Extensions whose signature starts with an uppercase letter are optional
    // caches. The others (like the split index and the sparse index) change
    // what the entries mean, so like git, refuse an index that has one.
    while (reader.tell() + 8 <= buffer.length - 20) {
      const signature = reader.toString('utf8', 4)
      const size = reader.readUInt32BE()
      if (!(signature[0] >= 'A' && signature[0] <= 'Z')) {
        throw new InternalError(`Unsupported index extension: ${signature}`)
      }
      reader.seek(reader.tell() + size)
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
    // Keep the skip-worktree bit of a path outside the sparse checkout.
    // Intent-to-add is cleared, since the path is now staged.
    const existing = stage === 0 ? this._entries.get(filepath) : undefined
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
      oid,
      flags: {
        assumeValid: false,
        extended: false,
        stage,
        nameLength: bfilepath.length < 0xfff ? bfilepath.length : 0xfff,
        skipWorktree: Boolean(existing?.flags.skipWorktree),
        intentToAdd: false,
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

  static async _entryToBuffer(entry, previousPath) {
    const bpath = Buffer.from(entry.path)
    const extended = hasExtendedFlags(entry)
    let name = bpath
    let length
    if (previousPath) {
      // Version 4: the number of bytes to drop from the end of the previous
      // path, then what to append to it, and no padding
      const common = commonPrefixLength(previousPath, bpath)
      name = Buffer.concat([
        encodeVarInt(previousPath.length - common),
        bpath.slice(common),
      ])
      length = 62 + (extended ? 2 : 0) + name.length + 1
    } else {
      // the fixed length + the extended flags (if any) + the filename + at
      // least one null char => align by 8
      length = Math.ceil((62 + (extended ? 2 : 0) + bpath.length + 1) / 8) * 8
    }
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
    if (extended) {
      writer.writeUInt16BE(renderCacheEntryExtendedFlags(entry))
    }
    writer.copy(name)
    return written
  }

  async toObject() {
    const header = Buffer.alloc(12)
    const writer = new BufferCursor(header)
    writer.write('DIRC', 4, 'utf8')
    // Like canonical git, keep version 4 if the index was read as version 4,
    // otherwise only use version 3 when an entry needs it
    const version =
      this._version === 4 ? 4 : this.entriesFlat.some(hasExtendedFlags) ? 3 : 2
    writer.writeUInt32BE(version)
    writer.writeUInt32BE(this.entriesFlat.length)

    let previousPath = version === 4 ? Buffer.alloc(0) : undefined
    const entryToBuffer = entry => {
      const buffer = GitIndex._entryToBuffer(entry, previousPath)
      if (previousPath) previousPath = Buffer.from(entry.path)
      return buffer
    }
    let entryBuffers = []
    for (const entry of this.entries) {
      entryBuffers.push(entryToBuffer(entry))
      if (entry.stages.length > 1) {
        for (const stage of entry.stages) {
          if (stage && stage !== entry) {
            entryBuffers.push(entryToBuffer(stage))
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
