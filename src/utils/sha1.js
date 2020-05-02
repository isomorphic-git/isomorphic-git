/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

// Code originally from https://github.com/crypto-browserify/sha.js/commit/100edf9c567e1e1079dc1d6d7c7725a0644e425c
// This code has been modified to use Typed ArrayBuffers. -WMH

const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0]

const BLOCK_SIZE = 64
const FINAL_SIZE = 56

// Re-usable scratch buffer of size 80 bytes
let W

// prototype class for hash functions
export default class Hash {
  constructor() {
    if (!W) W = new Array(80)

    this._a = 0x67452301
    this._b = 0xefcdab89
    this._c = 0x98badcfe
    this._d = 0x10325476
    this._e = 0xc3d2e1f0

    this._buffer = new ArrayBuffer(64)
    this._block = new DataView(this._buffer)
    this._len = 0
  }

  update(data) {
    var block = this._block
    var blockSize = BLOCK_SIZE
    var length = data.length
    var accum = this._len

    for (var offset = 0; offset < length; ) {
      var assigned = accum % blockSize
      var remainder = Math.min(length - offset, blockSize - assigned)

      for (var i = 0; i < remainder; i++) {
        block.setUint8(assigned + i, data[offset + i])
      }

      accum += remainder
      offset += remainder

      if (accum % blockSize === 0) {
        this._update(block)
      }
    }

    this._len += length
    return this
  }

  digest() {
    var rem = this._len % BLOCK_SIZE

    this._block.setUint8(rem, 0x80)

    // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
    // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
    for (var i = rem + 1; i < BLOCK_SIZE; i++) this._block.setUint8(i, 0)

    if (rem >= FINAL_SIZE) {
      this._update(this._block)
      for (i = 0; i < BLOCK_SIZE; i++) this._block.setUint8(i, 0)
    }

    var bits = this._len * 8

    // uint32
    if (bits <= 0xffffffff) {
      this._block.setUint32(BLOCK_SIZE - 4, bits)

      // uint64
    } else {
      var lowBits = (bits & 0xffffffff) >>> 0
      var highBits = (bits - lowBits) / 0x100000000

      this._block.setUint32(BLOCK_SIZE - 8, highBits)
      this._block.setUint32(BLOCK_SIZE - 4, lowBits)
    }

    this._update(this._block)
    var hash = this._hash()

    return hash
  }

  _update(M) {
    var a = this._a | 0
    var b = this._b | 0
    var c = this._c | 0
    var d = this._d | 0
    var e = this._e | 0

    for (var i = 0; i < 16; ++i) W[i] = M.getUint32(i * 4)
    for (; i < 80; ++i)
      W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

    for (var j = 0; j < 80; ++j) {
      var s = ~~(j / 20)
      var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

      e = d
      d = c
      c = rotl30(b)
      b = a
      a = t
    }

    this._a = (a + this._a) | 0
    this._b = (b + this._b) | 0
    this._c = (c + this._c) | 0
    this._d = (d + this._d) | 0
    this._e = (e + this._e) | 0
  }

  _hash() {
    var B = new ArrayBuffer(20)
    var H = new DataView(B)

    H.setUint32(0, this._a | 0)
    H.setUint32(4, this._b | 0)
    H.setUint32(8, this._c | 0)
    H.setUint32(12, this._d | 0)
    H.setUint32(16, this._e | 0)

    return B
  }
}

function rotl1(num) {
  return (num << 1) | (num >>> 31)
}

function rotl5(num) {
  return (num << 5) | (num >>> 27)
}

function rotl30(num) {
  return (num << 30) | (num >>> 2)
}

function ft(s, b, c, d) {
  if (s === 0) return (b & c) | (~b & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}
