import { fromNodeStream, fromStream } from './AsyncIterator.js'
import { asyncIteratorToStream } from './asyncIteratorToStream.js'
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
  let res = await global.fetch(url, { method, headers, body })
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

async function httpNode ({
  url,
  method = 'GET',
  headers = {},
  body
}) {
  if (body) {
    body = asyncIteratorToStream(body)
  }
  return new Promise((resolve, reject) => {
    const get = require('simple-get')
    get({
      url,
      method,
      headers,
      body
    }, (err, res) => {
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
    })
  })
}
