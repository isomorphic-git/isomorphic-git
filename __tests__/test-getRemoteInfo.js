/* eslint-env node, browser, jasmine */
import { Errors, getRemoteInfo } from 'isomorphic-git'
import http from 'isomorphic-git/http'

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
      {
        "heads": {
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

  describe('malicious ref names', () => {
    // Serve a canned refs advertisement so we can pretend to be a hostile server
    const mockServer = (refLines, capabilities = 'side-band-64k') =>
      /** @type {any} */ ({
        async request({ url }) {
          const pkt = line =>
            (line.length + 4).toString(16).padStart(4, '0') + line
          const [firstRef, ...restRefs] = refLines
          const body =
            pkt(`# service=git-upload-pack\n`) +
            '0000' +
            pkt(`${firstRef}\x00${capabilities}\n`) +
            restRefs.map(ref => pkt(`${ref}\n`)).join('') +
            '0000'
          return {
            url,
            method: 'GET',
            statusCode: 200,
            statusMessage: 'OK',
            body: [Buffer.from(body)],
            headers: {},
          }
        },
      })

    const oid = '97c024f73eaab2781bf3691597bc7c833cb0e22f'
    // the whole point is to probe for properties that shouldn't be there
    const proto = /** @type {any} */ (Object.prototype)

    afterEach(() => {
      // don't let a regression leak into the rest of the suite
      delete proto.corsProxy
      delete proto.polluted
    })

    it('does not pollute Object.prototype via a __proto__ ref', async () => {
      // Test
      const info = await getRemoteInfo({
        http: mockServer([
          `http://attacker.example.com/proxy __proto__/corsProxy`,
          `${oid} refs/heads/main`,
        ]),
        url: `http://${localhost}:8888/test-dumb-http-server.git`,
      })
      // The prototype is untouched...
      expect(proto.corsProxy).toBeUndefined()
      expect(/** @type {any} */ ({}).corsProxy).toBeUndefined()
      // ...and the poisoned ref is not smuggled into the result either, so
      // consumers that clone or merge it can't be polluted downstream.
      expect(Object.prototype.hasOwnProperty.call(info, '__proto__')).toBe(
        false
      )
      expect(JSON.stringify(info)).not.toContain('attacker.example.com')
      // Honest refs alongside it still come through
      expect(info.refs.heads.main).toEqual(oid)
    })

    it('does not pollute Object.prototype via a __proto__ symref', async () => {
      // Test
      const info = await getRemoteInfo({
        http: mockServer(
          [`${oid} refs/heads/main`],
          `side-band-64k symref=__proto__/corsProxy:http://attacker.example.com/proxy`
        ),
        url: `http://${localhost}:8888/test-dumb-http-server.git`,
      })
      // Test
      expect(proto.corsProxy).toBeUndefined()
      expect(/** @type {any} */ ({}).corsProxy).toBeUndefined()
      // `capabilities` echoes the raw symref string as documented, but nothing
      // from it reaches the ref tree
      expect(JSON.stringify(info.refs)).not.toContain('attacker.example.com')
      expect(Object.prototype.hasOwnProperty.call(info, '__proto__')).toBe(
        false
      )
      expect(/** @type {any} */ (info).corsProxy).toBeUndefined()
    })

    it('does not walk the prototype chain via a constructor ref', async () => {
      // Test
      const info = await getRemoteInfo({
        http: mockServer([`${oid} constructor/prototype/polluted`]),
        url: `http://${localhost}:8888/test-dumb-http-server.git`,
      })
      // Test
      expect(proto.polluted).toBeUndefined()
      expect(/** @type {any} */ ({}).polluted).toBeUndefined()
      // `constructor` is a legal ref name, so it is shadowed rather than dropped
      expect(info.constructor.prototype.polluted).toEqual(oid)
    })
  })
})
