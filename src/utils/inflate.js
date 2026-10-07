/* eslint-env node, browser */
/* global DecompressionStream */
import pako from 'pako'

import { browserInflate } from './browserInflate.js'

let supportsDecompressionStream = false

export async function inflate(buffer) {
  if (supportsDecompressionStream === null) {
    supportsDecompressionStream = testDecompressionStream()
  }
  try {
    return supportsDecompressionStream
      ? await browserInflate(buffer)
      : pako.inflate(buffer)
  } catch (err) {
    if (typeof err === 'string') {
      // Pako throws strings for corrupt data; preserve existing Error objects.
      throw new Error(`Invalid compressed buffer: ${err}`)
    }
    throw err
  }
}

function testDecompressionStream() {
  try {
    const ds = new DecompressionStream('deflate')
    if (ds) return true
  } catch (_) {
    // no bother
  }
  return false
}
