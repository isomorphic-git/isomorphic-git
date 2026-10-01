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
  fetchOptions = {},
  body,
  signal,
}) {
  // If we can, we should send it as a single buffer so it sets a Content-Length header.
  if (body && Array.isArray(body)) {
    // @ts-expect-error
    body = Buffer.from(await collect(body))
  } else if (body) {
    body = asyncIteratorToStream(body)
  }
  const { followRedirects = true, maxRedirects = 10, ...options } = fetchOptions
  /** @type {RedirectableRequest} */
  let next = { url, method: method.toUpperCase(), headers, body }
  for (let redirects = 0; ; redirects++) {
    const res = await send({
      ...options,
      ...next,
      agent,
      signal: signal ?? options.signal,
    })
    const location = res.headers.location
    if (
      !followRedirects ||
      res.statusCode < 300 ||
      res.statusCode >= 400 ||
      !location
    ) {
      return toResponse(res)
    }
    // Discard the redirect body. simple-get has already wrapped it in a
    // decompressor, so a malformed body must not become an unhandled error.
    res.on('error', () => {})
    res.resume()
    if (redirects >= maxRedirects) throw new Error('too many redirects')
    next = redirectRequest(next, res.statusCode, location)
    // simple-get builds a body from `form` on every call; like its own
    // redirect handling, send it only with the first request.
    delete options.form
  }
}

/**
 * @typedef {Object} RedirectableRequest
 * @property {string} url
 * @property {string} method
 * @property {Object<string, string>} headers
 * @property {any} body
 */

/**
 * Follows a redirect the way simple-get did, except that credentials are scoped
 * to an origin (scheme, host and port) rather than to a hostname, like curl,
 * which canonical git uses. simple-get kept the Authorization header when a
 * redirect changed only the port or the scheme.
 *
 * @param {RedirectableRequest} previous
 * @param {number} statusCode
 * @param {string} location
 * @returns {RedirectableRequest}
 */
function redirectRequest(previous, statusCode, location) {
  const url = new URL(location, previous.url)
  const sameOrigin = url.origin === new URL(previous.url).origin
  let { method, body } = previous
  const dropped = ['host']
  if (!sameOrigin) dropped.push('authorization', 'cookie')
  if (method === 'POST' && (statusCode === 301 || statusCode === 302)) {
    method = 'GET'
    body = undefined
    dropped.push('content-length', 'content-type')
  }
  /** @type {Object<string, string>} */
  const headers = {}
  for (const [name, value] of Object.entries(previous.headers)) {
    if (!dropped.includes(name.toLowerCase())) headers[name] = value
  }
  return { url: url.href, method, headers, body }
}

/**
 * @param {object} options
 * @returns {Promise<any>}
 */
function send(options) {
  return new Promise((resolve, reject) => {
    get({ ...options, followRedirects: false }, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  })
}

/**
 * @param {any} res
 * @returns {GitHttpResponse}
 */
function toResponse(res) {
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
