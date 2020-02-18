import '../typedefs.js'

import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { collect } from '../utils/collect.js'
import { extractAuthFromUrl } from '../utils/extractAuthFromUrl.js'
import { parseRefsAdResponse } from '../wire/parseRefsAdResponse.js'

// Try to accomodate known CORS proxy implementations:
// - https://jcubic.pl/proxy.php?  <-- uses query string
// - https://cors.isomorphic-git.org  <-- uses path
const corsProxify = (corsProxy, url) =>
  corsProxy.endsWith('?')
    ? `${corsProxy}${url}`
    : `${corsProxy}/${url.replace(/^https?:\/\//, '')}`

export class GitRemoteHTTP {
  static async capabilities() {
    return ['discover', 'connect']
  }

  /**
   * @param {Object} args
   * @param {HttpClient} args.http
   * @param {ProgressCallback} [args.onProgress]
   * @param {AuthCallback} [args.onAuth]
   * @param {AuthSuccessCallback} [args.onAuthSuccess]
   * @param {AuthFailureCallback} [args.onAuthFailure]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {Object<string, string>} [args.headers]
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
  }) {
    let { url, auth } = extractAuthFromUrl(_origUrl)
    const proxifiedURL = corsProxy ? corsProxify(corsProxy, url) : url
    if (auth.username || auth.password) {
      headers.Authorization = calculateBasicAuthHeader(auth)
    }
    // TODO: let onAuthFailure return an auth, to indicate retrying
    let res = await http({
      onProgress,
      method: 'GET',
      url: `${proxifiedURL}/info/refs?service=${service}`,
      headers,
    })
    // 401 is the "correct" response. 203 is Non-Authoritative Information and comes from Azure DevOps, which
    // apparently doesn't realize this is a git request and is returning the HTML for the "Azure DevOps Services | Sign In" page.
    if ((res.statusCode === 401 || res.statusCode === 203) && onAuth) {
      // Acquire credentials and try again
      // TODO: read `useHttpPath` value from git config and pass along?
      auth = await onAuth(url, {
        ...auth,
        headers: { ...headers },
      })
      // Update the basic auth header
      if (auth.username || auth.password) {
        headers.Authorization = calculateBasicAuthHeader(auth)
      }
      // but any manually provided headers take precedence
      if (auth.headers) {
        headers = { ...headers, ...auth.headers }
      }
      // Try again
      res = await http({
        onProgress,
        method: 'GET',
        url: `${proxifiedURL}/info/refs?service=${service}`,
        headers,
      })
      // Tell credential manager if the credentials were no good
      if (res.statusCode === 401 && onAuthFailure) {
        await onAuthFailure(_origUrl, auth)
      } else if (res.statusCode === 200 && onAuthSuccess) {
        await onAuthSuccess(_origUrl, auth)
      }
    }
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      })
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
      const data = Buffer.from(await collect(res.body))
      const response = data.toString('utf8')
      const preview =
        response.length < 256 ? response : response.slice(0, 256) + '...'
      // For backwards compatibility, try to parse it anyway.
      try {
        const remoteHTTP = await parseRefsAdResponse([data], { service })
        remoteHTTP.auth = auth
        return remoteHTTP
      } catch (e) {
        throw new GitError(E.RemoteDoesNotSupportSmartHTTP, {
          preview,
          response,
        })
      }
    }
  }

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
    const urlAuth = extractAuthFromUrl(url)
    if (urlAuth) url = urlAuth.url
    if (corsProxy) url = corsProxify(corsProxy, url)

    headers['content-type'] = `application/x-${service}-request`
    headers.accept = `application/x-${service}-result`

    // Update the basic auth header
    if (auth.username || auth.password) {
      headers.Authorization = calculateBasicAuthHeader(auth)
    }
    // but any manually provided headers take precedence
    if (auth.headers) {
      headers = { ...headers, ...auth.headers }
    }
    const res = await http({
      onProgress,
      method: 'POST',
      url: `${url}/${service}`,
      body,
      headers,
    })
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      })
    }
    return res
  }
}
