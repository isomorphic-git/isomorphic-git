/* eslint-env node, browser */
/* global DecompressionStream */
import pako from 'pako'

let supportsDecompressionStream = false

export async function inflate(buffer) {
  if (supportsDecompressionStream === null) {
    supportsDecompressionStream = testDecompressionStream()
  }
  return supportsDecompressionStream
    ? browserInflate(buffer)
    : pako.inflate(buffer)
}

async function browserInflate(buffer) {
  const ds = new DecompressionStream('deflate')
  const d = new Blob([buffer]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(d).arrayBuffer())
}

function testDecompressionStream() {
  try {
    const ds = new DecompressionStream('deflate')
    // Test if `Blob.stream` is present. React Native does not have the `stream` method
    const stream = new Blob([]).stream()
    stream.cancel()
    if (ds) return true
  } catch (_) {
    // no bother
  }
  return false
}
