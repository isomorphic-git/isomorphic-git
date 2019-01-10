import { fromStream } from './AsyncIterator.js'
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
