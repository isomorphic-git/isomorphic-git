import { BufferCursor } from '../utils/BufferCursor.js'
import { crc32 } from '../utils/crc32.js'

export const INDEX_CHUNK_SIZE = 16
export const MAX_HASH_CONFLICTS = 64

/**
 * An index for quickly identifying string matches in a blob
 *
 * @typedef {Object} DeltaIndex
 * @property {Map<number, number>} index
 * @property {number} chunkSize
 */

/**
 * @param {Buffer} source
 * @returns {DeltaIndex}
 */
export function indexDelta(source) {
  const reader = new BufferCursor(source)

  const index = new Map()
  let i = 0
  while (!reader.eof()) {
    const key = crc32(reader.slice(INDEX_CHUNK_SIZE))
    const val = index.get(key) || []
    if (val.length < MAX_HASH_CONFLICTS) val.push(i)
    index.set(key, val)
    i++
  }

  return {
    chunkSize: INDEX_CHUNK_SIZE,
    index,
  }
}
