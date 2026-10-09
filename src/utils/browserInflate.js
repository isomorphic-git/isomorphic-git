/* eslint-env node, browser */
/* global DecompressionStream */

import { DecompressionError } from '../errors/DecompressionError.js'

export async function browserInflate(buffer) {
  const ds = new DecompressionStream('deflate')
  const d = new Blob([buffer]).stream().pipeThrough(ds)
  try {
    return new Uint8Array(await new Response(d).arrayBuffer())
  } catch (err) {
    // Some native implementations reject corrupt data with an empty TypeError.
    if (err && err.name === 'TypeError' && err.message === '') {
      throw new DecompressionError('decompression failed')
    }
    throw err
  }
}
