/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { Errors, getRemoteInfo } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('getRemoteInfo', () => {
  it('getRemoteInfo', async () => {
    const info = await getRemoteInfo({
      http,
      url: `http://${localhost}:8888/test-dumb-http-server.git`,
    })
    expect(info).not.toBeNull()
    expect(info.capabilities).not.toBeNull()
    expect(info.refs).not.toBeNull()
    expect(info.refs).toMatchInlineSnapshot(`
      Object {
        "heads": Object {
          "master": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
          "test": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
        },
      }
    `)
  })
  ;(process.browser ? it : xit)(
    'detects "dumb" HTTP server responses',
    async () => {
      let error = null
      try {
        await getRemoteInfo({
          http,
          url: `http://${localhost}:9876/base/__tests__/__fixtures__/test-dumb-http-server.git`,
        })
      } catch (err) {
        error = err
      }
      expect(error).not.toBeNull()
      expect(error instanceof Errors.SmartHttpError).toBe(true)
    }
  )
  it('throws UnknownTransportError if using shorter scp-like syntax', async () => {
    // Test
    let err
    try {
      await getRemoteInfo({
        http,
        url: `git@github.com:isomorphic-git/isomorphic-git.git`,
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toEqual(Errors.UnknownTransportError.code)
  })
})
