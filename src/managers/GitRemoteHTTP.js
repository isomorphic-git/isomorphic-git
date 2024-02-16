import '../typedefs.js'

import { HttpError } from '../errors/HttpError.js'
import { SmartHttpError } from '../errors/SmartHttpError.js'
import { UserCanceledError } from '../errors/UserCanceledError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { collect } from '../utils/collect.js'
import { extractAuthFromUrl } from '../utils/extractAuthFromUrl.js'
import { parseRefsAdResponse } from '../wire/parseRefsAdResponse.js'

// Try to accommodate known CORS proxy implementations:
// - https://jcubic.pl/proxy.php?  <-- uses query string
// - https://cors.isomorphic-git.org  <-- uses path
const corsProxify = (corsProxy, url) =>
  corsProxy.endsWith('?')
    ? `${corsProxy}${url}`
    : `${corsProxy}/${url.replace(/^https?:\/\//, '')}`

const updateHeaders = (headers, auth) => {
  // Update the basic auth header
  if (auth.username || auth.password) {
    headers.Authorization = calculateBasicAuthHeader(auth)
  }
  // but any manually provided headers take precedence
  if (auth.headers) {
    Object.assign(headers, auth.headers)
  }
}

/**
 * @param {GitHttpResponse} res
 *
 * @returns {{ preview: string, response: string, data: Buffer }}
 */
const stringifyBody = async res => {
  try {
    // Some services provide a meaningful error message in the body of 403s like "token lacks the scopes necessary to perform this action"
    const data = Buffer.from(await collect(res.body))
    const response = data.toString('utf8')
    const preview =
      response.length < 256 ? response : response.slice(0, 256) + '...'
    return { preview, response, data }
  } catch (e) {
    return {}
  }
}

export class GitRemoteHTTP {
  static async capabilities() {
    return ['discover', 'connect']
  }

  /**
   * @param {Object} args
   * @param {HttpClient} args.http
   * @param {ProgressCallback} [args.onProgress]
   * @param {AuthCallback} [args.onAuth]
   * @param {AuthFailureCallback} [args.onAuthFailure]
   * @param {AuthSuccessCallback} [args.onAuthSuccess]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {Object<string, string>} args.headers
   * @param {1 | 2} args.protocolVersion - Git Protocol Version
   */
  static async discover({
    http,
    onProgress,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    corsProxy,
    service,
    url: _origUrl,
    headers,
    protocolVersion,
  }) {
    let { url, auth } = extractAuthFromUrl(_origUrl)
    const proxifiedURL = corsProxy ? corsProxify(corsProxy, url) : url
    if (auth.username || auth.password) {
      headers.Authorization = calculateBasicAuthHeader(auth)
    }
    if (protocolVersion === 2) {
      headers['Git-Protocol'] = 'version=2'
    }

    let res
    let tryAgain
    let providedAuthBefore = false
    do {
      res = await http.request({
        onProgress,
        method: 'GET',
        url: `${proxifiedURL}/info/refs?service=${service}`,
        headers,
      })

      // the default loop behavior
      tryAgain = false

      // 401 is the "correct" response for access denied. 203 is Non-Authoritative Information and comes from Azure DevOps, which
      // apparently doesn't realize this is a git request and is returning the HTML for the "Azure DevOps Services | Sign In" page.
      if (res.statusCode === 401 || res.statusCode === 203) {
        // On subsequent 401s, call `onAuthFailure` instead of `onAuth`.
        // This is so that naive `onAuth` callbacks that return a fixed value don't create an infinite loop of retrying.
        const getAuth = providedAuthBefore ? onAuthFailure : onAuth
        if (getAuth) {
          // Acquire credentials and try again
          // TODO: read `useHttpPath` value from git config and pass along?
          auth = await getAuth(url, {
            ...auth,
            headers: { ...headers },
          })
          if (auth && auth.cancel) {
            throw new UserCanceledError()
          } else if (auth) {
            updateHeaders(headers, auth)
            providedAuthBefore = true
            tryAgain = true
          }
        }
      } else if (
        res.statusCode === 200 &&
        providedAuthBefore &&
        onAuthSuccess
      ) {
        await onAuthSuccess(url, auth)
      }
    } while (tryAgain)

    if (res.statusCode !== 200) {
      const { response } = await stringifyBody(res)
      throw new HttpError(res.statusCode, res.statusMessage, response)
    }
    // Git "smart" HTTP servers should respond with the correct Content-Type header.
    if (
      res.headers['content-type'] === `application/x-${service}-advertisement`
    ) {
      const remoteHTTP = await parseRefsAdResponse(res.body, { service })
      remoteHTTP.auth = auth
      return remoteHTTP
    } else {
      // If they don't send the correct content-type header, that's a good indicator it is either a "dumb" HTTP
      // server, or the user specified an incorrect remote URL and the response is actually an HTML page.
      // In this case, we save the response as plain text so we can generate a better error message if needed.
      const { preview, response, data } = await stringifyBody(res)
      // For backwards compatibility, try to parse it anyway.
      // TODO: maybe just throw instead of trying?
      try {
        const remoteHTTP = await parseRefsAdResponse([data], { service })
        remoteHTTP.auth = auth
        return remoteHTTP
      } catch (e) {
        throw new SmartHttpError(preview, response)
      }
    }
  }

  /**
   * @param {Object} args
   * @param {HttpClient} args.http
   * @param {ProgressCallback} [args.onProgress]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {Object<string, string>} [args.headers]
   * @param {any} args.body
   * @param {any} args.auth
   */
  static async connect({
    http,
    onProgress,
    corsProxy,
    service,
    url,
    auth,
    body,
    headers,
  }) {
    // We already have the "correct" auth value at this point, but
    // we need to strip out the username/password from the URL yet again.
    const urlAuth = extractAuthFromUrl(url)
    if (urlAuth) url = urlAuth.url

    if (corsProxy) url = corsProxify(corsProxy, url)

    headers['content-type'] = `application/x-${service}-request`
    headers.accept = `application/x-${service}-result`
    updateHeaders(headers, auth)

    const res = await http.request({
      onProgress,
      method: 'POST',
      url: `${url}/${service}`,
      body,
      headers,
    })
    if (res.statusCode !== 200) {
      const { response } = stringifyBody(res)
      throw new HttpError(res.statusCode, res.statusMessage, response)
    }
    return res
  }
}
