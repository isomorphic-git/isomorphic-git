import pad from 'pad'
import pako from 'pako'
import path from 'path'
import createHash from 'sha.js'

import { GitObjectManager } from '../managers'
import { FileSystem } from '../models'

import { types } from './types'

export async function pack ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids,
  outputStream
}) {
  const fs = new FileSystem(_fs)
  let hash = createHash('sha1')
  function write (chunk, enc) {
    outputStream.write(chunk, enc)
    hash.update(chunk, enc)
  }
  function writeObject ({ stype, object }) {
    let lastFour, multibyte, length
    // Object type is encoded in bits 654
    let type = types[stype]
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
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    writeObject({ write, object, stype: type })
  }
  // Write SHA1 checksum
  let digest = hash.digest()
  outputStream.end(digest)
  return outputStream
}
