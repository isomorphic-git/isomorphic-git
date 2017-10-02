// @flow
import { Buffer } from 'buffer'
import { GitObjectManager } from '../managers'
import pad from 'pad'
import pako from 'pako'
import crypto from 'crypto'
/*::
import type {Writable} from 'stream'
*/

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000
}
// TODO: Move this to 'plumbing'
export async function pack (
  {
    oids,
    gitdir,
    outputStream
  } /*: {oids: Array<string>, gitdir: string, outputStream: Writable} */
) {
  let hash = crypto.createHash('sha1')
  let stream = outputStream
  function write (chunk, enc) {
    stream.write(chunk, enc)
    hash.update(chunk, enc)
  }
  function writeObject ({ stype, object }) {
    let lastFour, multibyte, length
    // Object type is encoded in bits 654
    let type = types[stype]
    if (type === undefined) throw new Error('Unrecognized type: ' + stype)
    // The length encoding get complicated.
    length = object.length
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = length > 0b1111 ? 0b10000000 : 0b0
    // Last four bits of length is encoded in bits 3210
    lastFour = length & 0b1111
    // Discard those bits
    length = length >>> 4
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte = (multibyte | type | lastFour).toString(16)
    write(byte, 'hex')
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0
      byte = multibyte | (length & 0b01111111)
      write(pad(2, byte.toString(16), '0'), 'hex')
      length = length >>> 7
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(pako.deflate(object)))
  }

  write('PACK')
  write('00000002', 'hex')
  // Write a 4 byte (32-bit) int
  write(pad(8, oids.length.toString(16), '0'), 'hex')
  for (let oid of oids) {
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
    writeObject({ write, object, stype: type })
  }
  // Write SHA1 checksum
  let digest = hash.digest()
  stream.end(digest)
  return stream
}
