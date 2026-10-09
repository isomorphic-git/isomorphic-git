/* eslint-env node, browser, jasmine */
/* global DecompressionStream */
import pako from 'pako'

import { browserInflate } from '../src/utils/browserInflate.js'

import { corruptZlibCases } from './__helpers__/corruptZlib.js'

const describeNative =
  typeof DecompressionStream === 'function' &&
  typeof Blob === 'function' &&
  typeof Blob.prototype.stream === 'function' &&
  typeof Response === 'function'
    ? describe
    : xdescribe

describeNative('browserInflate', () => {
  it('inflates valid binary data', async () => {
    const bytes = Uint8Array.from([0, 1, 127, 128, 255])
    expect(await browserInflate(pako.deflate(bytes))).toEqual(bytes)
  })

  it('inflates a valid empty stream', async () => {
    const bytes = new Uint8Array(0)
    expect(await browserInflate(pako.deflate(bytes))).toEqual(bytes)
  })

  for (const [name, bytes] of corruptZlibCases) {
    it(`reports ${name} compressed data with a nonempty error`, async () => {
      let error = null
      try {
        await browserInflate(Uint8Array.from(bytes))
      } catch (err) {
        error = err
      }
      // Native stream errors can originate outside Jest's VM realm.
      expect(Object.prototype.toString.call(error)).toBe('[object Error]')
      expect(error.message.length).toBeGreaterThan(0)
      expect(error.message).not.toMatch(/internal error|file an issue/)
    })
  }

  for (const original of [
    new TypeError(''),
    new TypeError('native diagnostic'),
  ]) {
    it(`handles an asynchronous TypeError with message "${original.message}"`, async () => {
      const arrayBuffer = Response.prototype.arrayBuffer
      Response.prototype.arrayBuffer = async function () {
        await arrayBuffer.call(this)
        throw original
      }
      let error = null
      try {
        await browserInflate(pako.deflate(Uint8Array.from([1, 2, 3])))
      } catch (err) {
        error = err
      } finally {
        Response.prototype.arrayBuffer = arrayBuffer
      }
      if (original.message) {
        expect(error).toBe(original)
      } else {
        expect(error.code).toBe('DecompressionError')
        expect(error.isIsomorphicGitError).toBe(true)
        expect(error.message).toBe(
          'Invalid compressed buffer: decompression failed'
        )
      }
    })
  }
})
