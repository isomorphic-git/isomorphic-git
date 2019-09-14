import { ProcessMap } from '../models/ProcessMap.js'

import { fromNodeStream } from './AsyncIterator.js'
import { asyncIteratorToStream } from './asyncIteratorToStream.js'
import { collect } from './collect.js'

const ProcessManager = new ProcessMap()

export async function http ({
  core,
  emitter,
  emitterPrefix,
  processId,
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
    const req = get(
      {
        url,
        method,
        headers,
        body
      },
      (err, res) => {
        ProcessManager.unregister(processId)
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
    ProcessManager.registerAbortCallback(processId, () => {
      req.abort()
    })
  })
}

http.abort = async function abort ({
  processId
}) {
  ProcessManager.abort(processId)
}
