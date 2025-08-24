import Hash from 'sha.js/sha1.js'

import { types } from '../commands/types.js'
import { _readObject as readObject } from '../storage/readObject.js'
import { deflate } from '../utils/deflate.js'
import { join } from '../utils/join.js'
import { padHex } from '../utils/padHex.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids
 */
export async function _pack({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  oids,
}) {
  const hash = new Hash()
  const outputStream = []
  function write(chunk, enc) {
    const buff = Buffer.from(chunk, enc)
    outputStream.push(buff)
    hash.update(buff)
  }
  async function writeObject({ stype, object }) {
    // Object type is encoded in bits 654
    const type = types[stype]
    // The length encoding gets complicated.
    let length = object.length
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    let multibyte = length > 0b1111 ? 0b10000000 : 0b0
    // Last four bits of length is encoded in bits 3210
    const lastFour = length & 0b1111
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
      write(padHex(2, byte), 'hex')
      length = length >>> 7
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(await deflate(object)))
  }
  write('PACK')
  write('00000002', 'hex')
  // Write a 4 byte (32-bit) int
  write(padHex(8, oids.length), 'hex')
  for (const oid of oids) {
    const { type, object } = await readObject({ fs, cache, gitdir, oid })
    await writeObject({ write, object, stype: type })
  }
  // Write SHA1 checksum
  const digest = hash.digest()
  outputStream.push(digest)
  return outputStream
}
