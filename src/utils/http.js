import { fromNodeStream } from './AsyncIterator.js'
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
        const iter = fromNodeStream(res)
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
