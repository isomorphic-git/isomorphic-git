import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

import '../../typedefs-http.js'
import { asyncIteratorToStream } from '../../utils/asyncIteratorToStream.js'
import { collect } from '../../utils/collect.js'
import { fromNodeStream } from '../../utils/fromNodeStream.js'

const MAX_REDIRECTS = 10

/**
 * @param {string} targetUrl
 * @param {object} options
 * @param {number} [redirectCount]
 * @returns {Promise<import('node:http').IncomingMessage>}
 */
function doRequest(targetUrl, options, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl)
    const transport = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || undefined,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      agent: options.agent,
    }

    const req = transport(reqOptions, res => {
      const statusCode = res.statusCode || 0
      if (
        statusCode >= 300 &&
        statusCode < 400 &&
        res.headers.location &&
        redirectCount < MAX_REDIRECTS
      ) {
        res.resume()
        const redirectUrl = new URL(res.headers.location, targetUrl).href
        const redirectHeaders = { ...options.headers }
        const redirectHost = new URL(redirectUrl).hostname
        if (redirectHost !== parsedUrl.hostname) {
          delete redirectHeaders.cookie
          delete redirectHeaders.authorization
        }
        resolve(
          doRequest(
            redirectUrl,
            { ...options, headers: redirectHeaders },
            redirectCount + 1
          )
        )
        return
      }
      resolve(res)
    })

    req.on('error', reject)

    if (options.body) {
      if (typeof options.body.pipe === 'function') {
        options.body.pipe(req)
      } else {
        req.end(options.body)
      }
    } else {
      req.end()
    }
  })
}

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

  if (body && !Buffer.isBuffer(body) && typeof body.pipe !== 'function') {
    body = Buffer.from(body)
  }

  if (body && Buffer.isBuffer(body)) {
    headers['content-length'] = body.length
  }

  const res = await doRequest(url, { method, headers, agent, body })

  return {
    url: res.url,
    method: res.method,
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
    body: fromNodeStream(res),
    headers: res.headers,
  }
}

export default { request }
