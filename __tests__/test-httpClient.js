/* eslint-env node, browser, jasmine */
import { PassThrough } from 'stream'

import { jest } from '@jest/globals'

describe('httpClient', () => {
  describe('web', () => {
    it('passes fetchOptions through to fetch', async () => {
      const originalFetch = globalThis.fetch
      /** @type {any} */
      let capturedInit = null
      globalThis.fetch = /** @type {any} */ (
        /**
         * @param {any} _url
         * @param {any} init
         */
        (_url, init) => {
          capturedInit = init
          return Promise.resolve({
            url: _url,
            method: init.method,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            body: null,
            arrayBuffer: async () => new ArrayBuffer(0),
          })
        }
      )
      try {
        const { request: webRequest } = await import('../src/http/web/index.js')
        await webRequest({
          url: 'http://example.com',
          method: 'GET',
          headers: {},
          fetchOptions: { credentials: 'include', mode: 'cors' },
        })
      } finally {
        globalThis.fetch = originalFetch
      }
      expect(capturedInit).not.toBeNull()
      expect(capturedInit.credentials).toBe('include')
      expect(capturedInit.mode).toBe('cors')
    })

    it('omits fetchOptions when not provided (backward compatible)', async () => {
      const originalFetch = globalThis.fetch
      /** @type {any} */
      let capturedInit = null
      globalThis.fetch = /** @type {any} */ (
        /**
         * @param {any} _url
         * @param {any} init
         */
        (_url, init) => {
          capturedInit = init
          return Promise.resolve({
            url: _url,
            method: init.method,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            body: null,
            arrayBuffer: async () => new ArrayBuffer(0),
          })
        }
      )
      try {
        const { request: webRequest } = await import('../src/http/web/index.js')
        await webRequest({
          headers: {},
        })
      } finally {
        globalThis.fetch = originalFetch
      }
      expect(capturedInit).not.toBeNull()
      expect(capturedInit.method).toBe('GET')
      // No fetchOptions provided -> only method/headers/body should be present
      expect(capturedInit.credentials).toBeUndefined()
    })
  })

  describe('node', () => {
    it('passes fetchOptions through to simple-get', async () => {
      /** @type {any} */
      let capturedOpts = null
      const mockGet = jest.fn(
        /**
         * @param {any} opts
         * @param {any} cb
         */
        (opts, cb) => {
          capturedOpts = opts
          const mockResponse = Object.assign(new PassThrough(), {
            url: opts.url,
            method: opts.method,
            statusCode: 200,
            statusMessage: 'OK',
            headers: {},
          })
          mockResponse.end()
          cb(null, mockResponse)
        }
      )

      jest.unstable_mockModule('simple-get', () => ({
        __esModule: true,
        default: mockGet,
      }))

      const { request: nodeRequest } = await import('../src/http/node/index.js')

      await nodeRequest({
        url: 'http://example.com',
        method: 'GET',
        headers: {},
        fetchOptions: { timeout: 5000, family: 4 },
      })
      expect(capturedOpts).not.toBeNull()
      expect(capturedOpts.timeout).toBe(5000)
      expect(capturedOpts.family).toBe(4)
      expect(capturedOpts.url).toBe('http://example.com')
    })
  })
})
