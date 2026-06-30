/* eslint-env node, browser, jasmine */
import { jest } from '@jest/globals'

import { request as nodeRequest } from '../src/http/node/index.js'
import { request as webRequest } from '../src/http/web/index.js'

const mockSimpleGet = jest.fn()
jest.mock('simple-get', () => ({
  __esModule: true,
  default: mockSimpleGet,
}))

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
        await webRequest({
          url: 'https://example.com',
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
        await webRequest({
          url: 'https://example.com',
          method: 'GET',
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
      mockSimpleGet.mockImplementation(
        /**
         * @param {any} opts
         * @param {any} cb
         */
        (opts, cb) => {
          cb(null, {
            url: opts.url,
            method: opts.method,
            statusCode: 200,
            statusMessage: 'OK',
            headers: {},
          })
        }
      )
      await nodeRequest({
        url: 'http://example.com',
        method: 'GET',
        headers: {},
        fetchOptions: { timeout: 5000, family: 4 },
      })
      expect(mockSimpleGet).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
          family: 4,
        }),
        expect.any(Function)
      )
    })
  })
})
