import BufferCursor from 'buffercursor'
import pako from 'pako'
import applyDelta from 'git-apply-delta'
import { GitPackIndex } from './GitPackIndex'

const types = {
  0b0010000: 'commit',
  0b0100000: 'tree',
  0b0110000: 'blob',
  0b1000000: 'tag',
  0b1100000: 'ofs_delta',
  0b1110000: 'ref_delta'
}

function decodeVarInt (reader) {
  let bytes = []
  let byte = 0
  let multibyte = 0
  do {
    byte = reader.readUInt8()
    // We keep bits 6543210
    const lastSeven = byte & 0b01111111
    bytes.push(lastSeven)
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = byte & 0b10000000
  } while (multibyte)
  // Now that all the bytes are in big-endian order,
  // alternate shifting the bits left by 7 and OR-ing the next byte.
  // And... do a weird increment-by-one thing that I don't quite understand.
  return bytes.reduce((a, b) => ((a + 1) << 7) | b, -1)
}

// I'm pretty much copying this one from the git C source code,
// because it makes no sense.
function otherVarIntDecode (reader, startWith) {
  let result = startWith
  let shift = 4
  let byte = null
  do {
    byte = reader.readUInt8()
    result |= (byte & 0b01111111) << shift
    shift += 7
  } while (byte & 0b10000000)
  return result
}

// function encodeVarInt (value) {
//   let bytes = []
//   do {
//     // We keep bits 6543210 and add them to the FRONT of an array,
//     // because we are seeing them in little-endian order, but want
//     // to return them in big-endian order.
//     const lastSeven = value & 0b01111111
//     bytes.unshift(lastSeven)
//     // Shift those seven bits off the edge of a cliff.
//     // NOTE: DO THE WEIRD INCREMENT THING.
//     value = (value >>> 7) - 1
//   } while (value > 0)
//   // Now that all the bytes are in big-endian order,
//   // set the MSB on all but the last byte.
//   bytes = bytes.map(byte => byte | 0b10000000)
//   bytes[bytes.length - 1] = bytes[bytes.length - 1] & 0b01111111
//   return bytes
// }

/** @ignore */
export class GitPackfile {
  constructor ({ pack, idx }) {
    Object.assign(this, {
      pack,
      idx
    })
  }
  static async from ({ pack, idx = null }) {
    // Packfiles do not store a list of the object ids (SHA1 hashes) they contain.
    // Therefore, reading individual objects from a packfile can only be done
    // after scanning and unzipping all of the objects in a packfile to discover
    // the oids.
    //
    // For efficiency's sake, after the scan we hold onto the results, which tell us
    // what objects are in the packfile and where in the file (measured as the starting
    // and ending indices of the bytes for that object). This is canonically saved in
    // a .idx file next to the .pack file in .git/objects/pack.
    //
    // If an .idx file is available, use it.
    if (idx) {
      idx = await GitPackIndex.fromIdx(idx)
      // Else generate an index by scanning.
    } else {
      idx = await GitPackIndex.fromPack(pack)
      // Note: The caller is responsible for saving the result back to disk using
      // this.idx.toBuffer()
    }
    return new GitPackfile({ pack, idx })
  }
  // NOTE:
  // Currently, the code for WRITING a pack file is in `src/commands/push.js`
  // I forget why it is there instead of here. Maybe the GitPackfile model was created after the fact?
  // anyway, look there for the inverse, e.g. how to serialize to a packfile.
  async read ({ oid } /*: {oid: string} */) {
    if (!this.idx.slices.has(oid)) return null
    let [start, end] = this.idx.slices.get(oid)
    return this.readSlice({ start, end })
  }
  async readSlice ({ start, end }) {
    let raw = this.pack.slice(start, end)
    let reader = new BufferCursor(raw)
    let byte = reader.readUInt8()
    // Object type is encoded in bits 654
    let btype = byte & 0b1110000
    let type = types[btype]
    if (type === undefined) {
      throw new Error('Unrecognized type: 0b' + btype.toString(2))
    }
    // The length encoding get complicated.
    // Last four bits of length is encoded in bits 3210
    let lastFour = byte & 0b1111
    let length = lastFour
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    let multibyte = byte & 0b10000000
    if (multibyte) {
      length = otherVarIntDecode(reader, lastFour)
    }
    // console.log('length =', length)
    let base = null
    let object = null
    // Handle deltified objects
    if (type === 'ofs_delta') {
      let offset = decodeVarInt(reader)
      let position = start - offset
      // console.log('base oid =', this.reverseOffsets.get(position))
      ;({ object: base, type } = await this.readSlice({ start: position }))
    }
    if (type === 'ref_delta') {
      let oid = reader.slice(20).toString('hex')
      // console.log('base oid =', oid)
      ;({ base: object, type } = await this.read({ oid }))
    }
    // Handle undeltified objects
    let buffer = raw.slice(reader.tell())
    object = Buffer.from(pako.inflate(buffer))
    // Assert that the object length is as expected.
    if (object.byteLength !== length) {
      throw new Error(
        `Packfile told us object would have length ${length} but it had length ${object.byteLength}`
      )
    }
    if (base) {
      object = applyDelta(object, base)
    }
    return { type, object }
  }
}
