import { fromNodeStream, fromStream } from './AsyncIterator.js'
import { asyncIteratorToStream } from './asyncIteratorToStream.js'
import { calculateBasicAuthHeader } from './calculateBasicAuthHeader.js'
import { collect } from './collect.js'

export async function http ({
  core,
  emitter,
  emitterPrefix,
  url,
  method = 'GET',
  headers = {},
  body
}) {
  return global.fetch
    ? httpBrowser({ core, emitter, emitterPrefix, url, method, headers, body })
    : httpNode({ core, emitter, emitterPrefix, url, method, headers, body })
}

async function httpBrowser ({ url, method = 'GET', headers = {}, body }) {
  // streaming uploads aren't possible yet in the browser
  if (body) {
    body = await collect(body)
  }
  // For whatever reason, the `fetch` API does not convert credentials embedded in the URL
  // into Basic Authentication headers automatically. Instead it throws an error!
  // So we must manually parse the URL, rip out the user:password portion if it is present
  // and compute the Authorization header.
  let urlObj = new URL(url)
  if (urlObj.username || urlObj.password) {
    // To try to be backwards compatible with simple-get's behavior, which uses Node's http.request
    // setting an Authorization header will override what is in the URL.
    if (!headers['Authorization']) {
      let { username, password } = urlObj
      headers['Authorization'] = calculateBasicAuthHeader({
        username,
        password
      })
    }
    urlObj.username = ''
    urlObj.password = ''
  }
  let res = await global.fetch(urlObj.href, { method, headers, body })
  let iter =
    res.body && res.body.getReader
      ? fromStream(res.body)
      : [new Uint8Array(await res.arrayBuffer())]
  return {
    url: res.url,
    method: res.method,
    statusCode: res.status,
    statusMessage: res.statusText,
    body: iter,
    headers: res.headers
  }
}

async function httpNode ({ url, method = 'GET', headers = {}, body }) {
  // If we can, we should send it as a single buffer so it sets a Content-Length header.
  if (body && Array.isArray(body)) {
    body = await collect(body)
  } else if (body) {
    body = asyncIteratorToStream(body)
  }
  return new Promise((resolve, reject) => {
    const get = require('simple-get')
    get(
      {
        url,
        method,
        headers,
        body
      },
      (err, res) => {
        if (err) return reject(err)
        let iter = fromNodeStream(res)
        resolve({
          url: res.url,
          method: res.method,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: iter,
          headers: res.headers
        })
      }
    )
  })
}
