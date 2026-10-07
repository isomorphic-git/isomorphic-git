/* eslint-env node, browser, jasmine */
import pako from 'pako'

import { inflate } from '../src/utils/inflate.js'

import { corruptZlibCases } from './__helpers__/corruptZlib.js'

describe('inflate', () => {
  it('inflates a valid stream', async () => {
    const bytes = Uint8Array.from([0, 1, 127, 128, 255])
    expect(await inflate(pako.deflate(bytes))).toEqual(bytes)
  })

  it('inflates a valid empty stream', async () => {
    const bytes = new Uint8Array(0)
    expect(await inflate(pako.deflate(bytes))).toEqual(bytes)
  })

  it('preserves an Error raised while reading compressed input', async () => {
    const original = new Error('compressed input unavailable')
    const input = {
      get length() {
        throw original
      },
    }
    let error = null
    try {
      await inflate(input)
    } catch (err) {
      error = err
    }
    expect(error).toBe(original)
  })

  for (const [name, bytes] of corruptZlibCases) {
    it(`rejects ${name} compressed data with an Error`, async () => {
      let error = null
      try {
        await inflate(Uint8Array.from(bytes))
      } catch (err) {
        error = err
      }
      expect(error instanceof Error).toBe(true)
      expect(error.name).toBe('Error')
      expect(error.message).toMatch(/^Invalid compressed buffer: .+/)
      expect(error.message).not.toMatch(/internal error|file an issue/)
    })
  }
})
