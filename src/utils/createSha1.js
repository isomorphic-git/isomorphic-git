// SHA-1 as defined in FIPS 180-4. The Node build uses createSha1.node.js instead.
import { toHex } from './toHex.js'

const W = new Int32Array(80)

class Sha1 {
  constructor() {
    this._h = new Int32Array([
      0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0,
    ])
    this._block = new Uint8Array(64)
    this._length = 0
  }

  update(data) {
    let filled = this._length % 64
    this._length += data.length
    for (let offset = 0; offset < data.length; ) {
      const n = Math.min(data.length - offset, 64 - filled)
      this._block.set(data.subarray(offset, offset + n), filled)
      offset += n
      filled += n
      if (filled === 64) {
        this._compress()
        filled = 0
      }
    }
    return this
  }

  digest(encoding) {
    const block = this._block
    const filled = this._length % 64
    block[filled] = 0x80
    block.fill(0, filled + 1)
    if (filled >= 56) {
      this._compress()
      block.fill(0)
    }
    const bits = this._length * 8
    writeUint32(block, 56, Math.floor(bits / 0x100000000))
    writeUint32(block, 60, bits)
    this._compress()

    const hash = new Uint8Array(20)
    for (let i = 0; i < 5; i++) writeUint32(hash, i * 4, this._h[i])
    return encoding === 'hex' ? toHex(hash) : Buffer.from(hash.buffer)
  }

  _compress() {
    const block = this._block
    for (let i = 0; i < 16; i++) {
      W[i] =
        (block[i * 4] << 24) |
        (block[i * 4 + 1] << 16) |
        (block[i * 4 + 2] << 8) |
        block[i * 4 + 3]
    }
    for (let i = 16; i < 80; i++) {
      W[i] = rotl(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
    }

    const h = this._h
    let a = h[0]
    let b = h[1]
    let c = h[2]
    let d = h[3]
    let e = h[4]
    for (let i = 0; i < 80; i++) {
      let f, k
      if (i < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (i < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const t = (rotl(a, 5) + f + e + k + W[i]) | 0
      e = d
      d = c
      c = rotl(b, 30)
      b = a
      a = t
    }
    h[0] += a
    h[1] += b
    h[2] += c
    h[3] += d
    h[4] += e
  }
}

function rotl(x, n) {
  return (x << n) | (x >>> (32 - n))
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = value >>> 24
  bytes[offset + 1] = value >>> 16
  bytes[offset + 2] = value >>> 8
  bytes[offset + 3] = value
}

export function createSha1() {
  return new Sha1()
}
