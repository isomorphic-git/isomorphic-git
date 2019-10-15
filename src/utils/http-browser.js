/* eslint-env browser */
import { ProcessMap } from '../models/ProcessMap.js'

import { fromStream } from './AsyncIterator.js'
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
  // streaming uploads aren't possible yet in the browser
  if (body) {
    body = await collect(body)
  }
  const options = { method, headers, body }
  if (processId !== void 0) {
    // TODO: Remove this progressive enhancement check when we drop support for Safari < 11.3
    if (typeof AbortController === 'function') {
      const controller = new AbortController()
      ProcessManager.registerAbortCallback(processId, () => controller.abort())
      options.signal = controller.signal
    }
  }
  const res = await fetch(url, options)
  const iter =
    res.body && res.body.getReader
      ? fromStream(res.body)
      : [new Uint8Array(await res.arrayBuffer())]
  // convert Header object to ordinary JSON
  headers = {}
  for (const [key, value] of res.headers.entries()) {
    headers[key] = value
  }
  return {
    url: res.url,
    method: res.method,
    statusCode: res.status,
    statusMessage: res.statusText,
    body: iter,
    headers: headers
  }
}

http.abort = async function abort ({ processId }) {
  ProcessManager.abort(processId)
}
