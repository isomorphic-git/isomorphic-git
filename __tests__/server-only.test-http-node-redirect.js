/* eslint-env node, browser, jasmine */
import { createServer } from 'http'

import { request } from '../src/http/node/index.js'
import { collect } from '../src/utils/collect.js'

/**
 * Starts an HTTP server on a free loopback port and records every request.
 *
 * @param {(req: any, res: any, body: Buffer) => void} handler
 */
async function startServer(handler) {
  const requests = []
  const server = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    requests.push({ method: req.method, headers: req.headers, body })
    handler(req, res, body)
  })
  await /** @type {Promise<void>} */ (
    new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  )
  const { port } = /** @type {import('net').AddressInfo} */ (server.address())
  return {
    port,
    requests,
    close: () => new Promise(resolve => server.close(resolve)),
  }
}

const ok = (req, res) => res.end('ok')
const redirectTo =
  (location, status = 302) =>
  (req, res) => {
    res.writeHead(status, { location })
    res.end()
  }

const credentials = {
  Authorization: 'Basic c3ludGhldGljOnNlY3JldA==',
  Cookie: 'session=synthetic',
}

describe('node http client redirects', () => {
  const servers = []
  const serve = async handler => {
    const server = await startServer(handler)
    servers.push(server)
    return server
  }

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => server.close()))
  })

  it('drops credentials when a redirect changes the port', async () => {
    const target = await serve(ok)
    const source = await serve(
      redirectTo(`http://127.0.0.1:${target.port}/repo.git/info/refs`)
    )

    const res = await request({
      url: `http://127.0.0.1:${source.port}/repo.git/info/refs`,
      headers: { ...credentials, 'User-Agent': 'git/isomorphic-git' },
    })

    expect(res.statusCode).toBe(200)
    expect(Buffer.from(await collect(res.body)).toString()).toBe('ok')
    expect(source.requests[0].headers.authorization).toBe(
      credentials.Authorization
    )
    expect(target.requests[0].headers.authorization).toBeUndefined()
    expect(target.requests[0].headers.cookie).toBeUndefined()
    expect(target.requests[0].headers['user-agent']).toBe('git/isomorphic-git')
  })

  it('drops credentials when a redirect changes the host', async () => {
    const target = await serve(ok)
    const source = await serve(redirectTo(`http://localhost:${target.port}/`))

    await request({
      url: `http://127.0.0.1:${source.port}/`,
      headers: credentials,
    })

    expect(target.requests[0].headers.authorization).toBeUndefined()
    expect(target.requests[0].headers.cookie).toBeUndefined()
  })

  it('keeps credentials on a same-origin redirect', async () => {
    const server = await serve((req, res) =>
      req.url === '/old' ? redirectTo('/new')(req, res) : ok(req, res)
    )

    await request({
      url: `http://127.0.0.1:${server.port}/old`,
      headers: credentials,
    })

    expect(server.requests).toHaveLength(2)
    expect(server.requests[1].headers.authorization).toBe(
      credentials.Authorization
    )
    expect(server.requests[1].headers.cookie).toBe(credentials.Cookie)
  })

  it('drops credentials for every later hop once the origin changed', async () => {
    const final = await serve(ok)
    const middle = await serve(redirectTo(`http://127.0.0.1:${final.port}/`))
    const source = await serve(redirectTo(`http://127.0.0.1:${middle.port}/`))

    await request({
      url: `http://127.0.0.1:${source.port}/`,
      headers: credentials,
    })

    expect(middle.requests[0].headers.authorization).toBeUndefined()
    expect(final.requests[0].headers.authorization).toBeUndefined()
  })

  it('turns POST into GET on 302 and replays it on 307', async () => {
    const target = await serve(ok)
    const found = await serve(redirectTo(`http://127.0.0.1:${target.port}/`))
    const temporary = await serve(
      redirectTo(`http://127.0.0.1:${target.port}/`, 307)
    )
    // The client sends array bodies as a single buffer.
    /** @type {any} */
    const body = [
      Buffer.from('0032want 0000000000000000000000000000000000000000\n'),
    ]
    const headers = { 'Content-Type': 'application/x-git-upload-pack-request' }

    await request({
      url: `http://127.0.0.1:${found.port}/`,
      method: 'POST',
      headers,
      body,
    })
    await request({
      url: `http://127.0.0.1:${temporary.port}/`,
      method: 'POST',
      headers,
      body,
    })

    expect(target.requests[0].method).toBe('GET')
    expect(target.requests[0].body.length).toBe(0)
    expect(target.requests[0].headers['content-type']).toBeUndefined()
    expect(target.requests[1].method).toBe('POST')
    expect(target.requests[1].body.toString()).toBe(body[0].toString())
  })

  it('honors followRedirects and maxRedirects', async () => {
    const target = await serve(ok)
    const source = await serve(redirectTo(`http://127.0.0.1:${target.port}/`))
    const loop = await serve(redirectTo('/'))

    const res = await request({
      url: `http://127.0.0.1:${source.port}/`,
      fetchOptions: { followRedirects: false },
    })
    await collect(res.body)
    expect(res.statusCode).toBe(302)
    expect(target.requests).toHaveLength(0)

    await expect(
      request({
        url: `http://127.0.0.1:${loop.port}/`,
        fetchOptions: { maxRedirects: 2 },
      })
    ).rejects.toThrow('too many redirects')
    expect(loop.requests).toHaveLength(3)
  })
})
