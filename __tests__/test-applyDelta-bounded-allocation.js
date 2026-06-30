/* eslint-env node, browser, jasmine */
import { applyDelta } from 'isomorphic-git/internal-apis'

// applyDelta should build its result from the delta ops rather than pre-allocating the
// size declared in the delta header. The declared target size may not match the actual
// op output, so allocating it up front can reserve far more memory than the ops produce.
function varIntLE(n) {
  const bytes = []
  do {
    let byte = n & 0x7f
    n = Math.floor(n / 128)
    if (n) byte |= 0x80
    bytes.push(byte)
  } while (n)
  return Buffer.from(bytes)
}

describe('applyDelta bounded allocation', () => {
  it('applies a valid multi-op delta correctly', () => {
    // sourceSize=0, targetSize=2, two 1-byte inserts ("a", "b")
    const delta = Buffer.concat([
      varIntLE(0),
      varIntLE(2),
      Buffer.from([0x01, 0x61, 0x01, 0x62]),
    ])
    expect(applyDelta(delta, Buffer.alloc(0)).toString()).toBe('ab')
  })

  it('throws when the declared target size exceeds the ops, without allocating it', () => {
    const measure = typeof process !== 'undefined' && process.memoryUsage
    const before = measure ? process.memoryUsage().external : 0
    // declared targetSize = 0x7FFFFFFF but only a single 1-byte insert op
    const delta = Buffer.concat([
      varIntLE(0),
      varIntLE(0x7fffffff),
      Buffer.from([0x01, 0x00]),
    ])
    expect(() => applyDelta(delta, Buffer.alloc(0))).toThrow()
    if (measure) {
      const grewMB = (process.memoryUsage().external - before) / 1024 / 1024
      expect(grewMB).toBeLessThan(100)
    }
  })
})
