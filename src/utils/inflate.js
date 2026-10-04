/* eslint-env node, browser */
/* global DecompressionStream */
import pako from 'pako'

import { InternalError } from '../errors/InternalError.js'

let supportsDecompressionStream = false

export async function inflate(buffer) {
  if (supportsDecompressionStream === null) {
    supportsDecompressionStream = testDecompressionStream()
  }
  try {
    return supportsDecompressionStream
      ? browserInflate(buffer)
      : pako.inflate(buffer)
  } catch (err) {
    if (typeof err === 'string') {
      throw new InternalError(`Invalid compressed buffer: ${err}`)
    }
    throw err
  }
}

async function browserInflate(buffer) {
  const ds = new DecompressionStream('deflate')
  const d = new Blob([buffer]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(d).arrayBuffer())
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
