/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { Errors, getRemoteInfo2 } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('getRemoteInfo2', () => {
  it('protocol 2', async () => {
    const info = await getRemoteInfo2({
      http,
      url: `http://${localhost}:8888/test-dumb-http-server.git`,
      protocolVersion: 2,
    })
    expect(info).toBeDefined()
    expect(info.capabilities).toBeDefined()
    expect(info.protocolVersion).toBe(2)
    if (info.protocolVersion === 2) {
      // The actual capabilities reported will vary depending on what version of git is installed on the machine running the test suite,
      // but I think it is fair to assume at least these two commands will be reported.
      expect(info.capabilities['ls-refs']).toBeDefined()
      expect(info.capabilities.fetch).toBeDefined()
    }
  })

  it('protocol 1', async () => {
    const info = await getRemoteInfo2({
      http,
      url: `http://${localhost}:8888/test-dumb-http-server.git`,
      protocolVersion: 1,
    })
    expect(info).toBeDefined()
    expect(info.capabilities).toBeDefined()
    expect(info.protocolVersion).toBe(1)
    if (info.protocolVersion === 1) {
      expect(info.refs).toBeDefined()
      expect(info.refs).toMatchInlineSnapshot(`
        Array [
          Object {
            "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
            "ref": "HEAD",
            "target": "refs/heads/master",
          },
          Object {
            "oid": "97c024f73eaab2781bf3691597bc7c833cb0e22f",
            "ref": "refs/heads/master",
          },
          Object {
            "oid": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
            "ref": "refs/heads/test",
          },
        ]
      `)
    }
  })
  ;(process.browser ? it : xit)(
    'detects "dumb" HTTP server responses',
    async () => {
      let error = null
      try {
        await getRemoteInfo2({
          http,
          url: `http://${localhost}:9876/base/__tests__/__fixtures__/test-dumb-http-server.git`,
        })
      } catch (err) {
        error = err
      }
      expect(error).toBeDefined()
      expect(error instanceof Errors.SmartHttpError).toBe(true)
    }
  )

  it('throws UnknownTransportError if using shorter scp-like syntax', async () => {
    // Test
    let err
    try {
      await getRemoteInfo2({
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
