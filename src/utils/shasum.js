/* eslint-env node, browser */
import Hash from 'sha.js/sha1.js'

import { toHex } from './toHex.js'

let supportsSubtleSHA1 = null

export async function shasum(buffer) {
  if (supportsSubtleSHA1 === null) {
    supportsSubtleSHA1 = await testSubtleSHA1()
  }
  return supportsSubtleSHA1 ? subtleSHA1(buffer) : shasumSync(buffer)
}

// This is modeled after @dominictarr's "shasum" module,
// but without the 'json-stable-stringify' dependency and
// extra type-casting features.
function shasumSync(buffer) {
  return new Hash().update(buffer).digest('hex')
}

async function subtleSHA1(buffer) {
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  return toHex(hash)
}

async function testSubtleSHA1() {
  // I'm using a rather crude method of progressive enhancement, because
  // some browsers that have crypto.subtle.digest don't actually implement SHA-1.
  try {
    const hash = await subtleSHA1(new Uint8Array([]))
    if (hash !== 'da39a3ee5e6b4b0d3255bfef95601890afd80709') return false
    // Also test with a subarray view at a non-zero offset
    // to detect the iOS WebKit bug (Safari < 16.4)
    const buf = new Uint8Array([0, 104, 101, 108, 108, 111, 0])
    const hashSlice = await subtleSHA1(buf.slice(1, 6)) // "hello"
    const hashSubarray = await subtleSHA1(buf.subarray(1, 6)) // "hello"
    return hashSlice === hashSubarray
  } catch (_) {
    // no bother
  }
  return false
}
