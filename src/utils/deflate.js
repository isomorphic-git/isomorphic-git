/* eslint-env node, browser */
/* global CompressionStream */
import pako from 'pako'

let supportsCompressionStream = null

export async function deflate(buffer) {
  if (supportsCompressionStream === null) {
    supportsCompressionStream = testCompressionStream()
  }
  return supportsCompressionStream
    ? browserDeflate(buffer)
    : pako.deflate(buffer)
}

async function browserDeflate(buffer) {
  const cs = new CompressionStream('deflate')
  const c = new Blob([buffer]).stream().pipeThrough(cs)
  return new Uint8Array(await new Response(c).arrayBuffer())
}

function testCompressionStream() {
  try {
    const cs = new CompressionStream('deflate')
    cs.writable.close()
    // Test if `Blob.stream` is present. React Native does not have the `stream` method
    const stream = new Blob([]).stream()
    stream.cancel()
    return true
  } catch (_) {
    return false
  }
}
