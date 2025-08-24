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
}) {
  // If we can, we should send it as a single buffer so it sets a Content-Length header.
  if (body && Array.isArray(body)) {
    body = Buffer.from(await collect(body))
  } else if (body) {
    body = asyncIteratorToStream(body)
  }
  return new Promise((resolve, reject) => {
    get(
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
  })
}

export default { request }
