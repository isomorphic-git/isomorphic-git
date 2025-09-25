import get from 'simple-get'

import '../../typedefs-http.js'
import { asyncIteratorToStream } from '../../utils/asyncIteratorToStream.js'
import { collect } from '../../utils/collect.js'
import { fromNodeStream } from '../../utils/fromNodeStream.js'

/**
 * HttpClient
 *
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */
export async function request({
  onProgress,
  url,
  method = 'GET',
  headers = {},
  agent,
  body,
  signal,
}) {
  // If we can, we should send it as a single buffer so it sets a Content-Length header.
  if (body && Array.isArray(body)) {
    body = Buffer.from(await collect(body))
  } else if (body) {
    body = asyncIteratorToStream(body)
  }

  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal && signal.aborted) {
      const error = new Error('The operation was aborted.')
      error.name = 'AbortError'
      reject(error)
      return
    }

    const request = get(
      {
        url,
        method,
        headers,
        agent,
        body,
      },
      (err, res) => {
        if (err) return reject(err)
        try {
          const iter = fromNodeStream(res)
          resolve({
            url: res.url,
            method: res.method,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            body: iter,
            headers: res.headers,
          })
        } catch (e) {
          reject(e)
        }
      }
    )

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        request.abort()
        const error = new Error('The operation was aborted.')
        error.name = 'AbortError'
        reject(error)
      }

      if (signal.aborted) {
        onAbort()
      } else {
        signal.addEventListener('abort', onAbort, { once: true })
      }
    }
  })
}

export default { request }
