/* eslint-env node, browser */
/* global DecompressionStream */

export async function browserInflate(buffer) {
  const ds = new DecompressionStream('deflate')
  const d = new Blob([buffer]).stream().pipeThrough(ds)
  try {
    return new Uint8Array(await new Response(d).arrayBuffer())
  } catch (err) {
    // Some native implementations reject corrupt data with an empty TypeError.
    if (err && err.name === 'TypeError' && err.message === '') {
      throw new Error('Invalid compressed buffer: decompression failed')
    }
    throw err
  }
}
