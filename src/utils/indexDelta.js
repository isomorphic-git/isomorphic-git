import { BufferCursor } from '../utils/BufferCursor.js'

export const INDEX_CHUNK_SIZE = 16

/**
 * @param {Buffer} source
 * @returns {string, number[]}
 */
export function indexDelta(source) {
  const reader = new BufferCursor(source)

  const index = new Map()
  let i = 0
  while (!reader.eof()) {
    const key = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
    if (key.length === INDEX_CHUNK_SIZE * 2) {
      const val = index.get(key) || []
      val.push(i)
      index.set(key, val)
      i++
    }
  }

  return index
}

/**
 * @param {Buffer} source
 * @param {Map<string, number[]} index
 * @returns {number[] | void}
 */
export function findAMatch(source, index) {
  const reader = new BufferCursor(source)

  let needle = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
  while (!reader.eof()) {
    const locations = index.get(needle)
    if (locations) {
      return locations.map(i => i * INDEX_CHUNK_SIZE)
    } else {
      needle = needle.slice(2) + reader.slice(1).toString('hex')
    }
  }
}

/**
 * @param {Buffer} source
 * @param {Map<string, number[]} index
 * @param {Buffer} haystack
 * @returns {Array<string | number[]> | void}
 */
export function findLongestMatch(source, index, haystack) {
  const reader = new BufferCursor(source)

  let needle = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
  let bestStart
  let insertBuffer = ''
  const ops = []
  while (!reader.eof()) {
    const locations = index.get(needle)
    if (locations) {
      let bestLength = -1
      console.log('locations', locations)
      // Scan forwards
      const sourceStart = reader.tell()
      for (const location of locations) {
        let i = sourceStart
        let j = (location + 1) * INDEX_CHUNK_SIZE
        const targetStart = j
        while (
          i < source.length &&
          j < haystack.length &&
          source[i] === haystack[j]
        ) {
          i++
          j++
        }
        if (i - sourceStart > bestLength) {
          bestLength = i - sourceStart
          bestStart = targetStart
        }
      }
      // Push insert operation
      ops.push(insertBuffer)
      insertBuffer = ''
      // Push copy operation
      ops.push([bestStart - INDEX_CHUNK_SIZE, bestLength + INDEX_CHUNK_SIZE])
      console.log(`bestLength = ${bestLength}`)
      reader.seek(sourceStart + bestLength)
      needle = reader.slice(INDEX_CHUNK_SIZE).toString('hex')
    } else {
      insertBuffer += needle.slice(0, 2)
      needle = needle.slice(2) + reader.slice(1).toString('hex')
    }
  }
  if (needle || insertBuffer) {
    insertBuffer += needle
    ops.push(insertBuffer)
  }
  return ops
}
