import '../commands/typedefs.js'

import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { calculateBasicAuthUsernamePasswordPair } from '../utils/calculateBasicAuthUsernamePasswordPair.js'
import { collect } from '../utils/collect.js'
import { extractAuthFromUrl } from '../utils/extractAuthFromUrl.js'
import { http as builtinHttp } from '../utils/http.js'
import { pkg } from '../utils/pkg.js'
import { parseRefsAdResponse } from '../wire/parseRefsAdResponse.js'

// Try to accomodate known CORS proxy implementations:
// - https://jcubic.pl/proxy.php?  <-- uses query string
// - https://cors.isomorphic-git.org  <-- uses path
const corsProxify = (corsProxy, url) =>
  corsProxy.endsWith('?')
    ? `${corsProxy}${url}`
    : `${corsProxy}/${url.replace(/^https?:\/\//, '')}`

export class GitRemoteHTTP {
  static async capabilities () {
    return ['discover', 'connect']
  }

  /**
   * @param {Object} args
   * @param {HttpClient} [args.http]
   * @param {ProgressCallback} [args.onProgress]
   * @param {AuthCallback} [args.onAuth]
   * @param {AuthSuccessCallback} [args.onAuthSuccess]
   * @param {AuthFailureCallback} [args.onAuthFailure]
   * @param {string} [args.corsProxy]
   * @param {string} args.service
   * @param {string} args.url
   * @param {boolean} args.noGitSuffix
   * @param {GitAuth} [args.auth]
   * @param {Object<string, string>} [args.headers]
   */
  static async discover ({
    http = builtinHttp,
    onProgress,
    onAuth,
    onAuthSuccess,
    onAuthFailure,
    corsProxy,
    service,
    url,
    noGitSuffix,
    auth,
    headers
  }) {
    const _origUrl = url
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    const urlAuth = extractAuthFromUrl(url)
    if (urlAuth) {
      url = urlAuth.url
      // To try to be backwards compatible with simple-get's behavior, which uses Node's http.request
      // setting an Authorization header will override what is in the URL.
      // Ergo manually specified auth parameters will override those in the URL.
      // However, since the oauth2 option is incompatible with usernames and passwords, rather than throw an
      // E.MixUsernamePasswordOauth2formatTokenError error, we'll avoid that situation by ignoring the username
      // and/or password in the url.
      if (!auth.oauth2format) {
        auth.username = auth.username || urlAuth.username
        auth.password = auth.password || urlAuth.password
      }
    }
    if (corsProxy) {
      url = corsProxify(corsProxy, url)
    }
    // headers['Accept'] = `application/x-${service}-advertisement`
    // Only send a user agent in Node and to CORS proxies by default,
    // because Gogs and others might not whitelist 'user-agent' in allowed headers.
    // Solutions using 'process.browser' can't be used as they rely on bundler shims,
    // ans solutions using 'process.versions.node' had to be discarded because the
    // BrowserFS 'process' shim is too complete.
    if (typeof window === 'undefined' || corsProxy) {
      headers['user-agent'] = headers['user-agent'] || pkg.agent
    }
    // If the username came from the URL, we want to allow the password to be missing.
    // This is because Github allows using the token as the username with an empty password
    // so that is a style of git clone URL we might encounter and we don't want to throw a "Missing password or token" error.
    // Also, we don't want to prematurely throw an error before the credentialManager plugin has
    // had an opportunity to provide the password.
    const _auth = calculateBasicAuthUsernamePasswordPair(auth, !!urlAuth)
    if (_auth) {
      headers['Authorization'] = calculateBasicAuthHeader(_auth)
    }
    let res = await http({
      onProgress,
      method: 'GET',
      url: `${url}/info/refs?service=${service}`,
      headers
    })
    if (res.statusCode === 401 && onAuth) {
      // Acquire credentials and try again
      // TODO: actually read `useHttpPath` value from git config
      auth = await onAuth({ url: _origUrl, useHttpPath: false })
      const _auth = calculateBasicAuthUsernamePasswordPair(auth)
      if (_auth) {
        headers['Authorization'] = calculateBasicAuthHeader(_auth)
      }
      res = await http({
        onProgress,
        method: 'GET',
        url: `${url}/info/refs?service=${service}`,
        headers
      })
      // Tell credential manager if the credentials were no good
      if (res.statusCode === 401 && onAuthFailure) {
        await onAuthFailure({ url: _origUrl, auth })
      } else if (res.statusCode === 200 && onAuthSuccess) {
        await onAuthSuccess({ url: _origUrl, auth })
      }
    }
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
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
      const data = await collect(res.body)
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
          response
        })
      }
    }
  }

  static async connect ({
    http = builtinHttp,
    onProgress,
    corsProxy,
    service,
    url,
    noGitSuffix,
    auth,
    body,
    headers
  }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    const urlAuth = extractAuthFromUrl(url)
    if (urlAuth) {
      url = urlAuth.url
      // To try to be backwards compatible with simple-get's behavior, which uses Node's http.request
      // setting an Authorization header will override what is in the URL.
      // Ergo manually specified auth parameters will override those in the URL.
      auth.username = auth.username || urlAuth.username
      auth.password = auth.password || urlAuth.password
    }
    if (corsProxy) {
      url = corsProxify(corsProxy, url)
    }
    headers['content-type'] = `application/x-${service}-request`
    headers['accept'] = `application/x-${service}-result`
    // Only send a user agent in Node and to CORS proxies by default,
    // because Gogs and others might not whitelist 'user-agent' in allowed headers.
    // Solutions using 'process.browser' can't be used as they rely on bundler shims,
    // ans solutions using 'process.versions.node' had to be discarded because the
    // BrowserFS 'process' shim is too complete.
    if (typeof window === 'undefined' || corsProxy) {
      headers['user-agent'] = headers['user-agent'] || pkg.agent
    }
    // If the username came from the URL, we want to allow the password to be missing.
    // This is because Github allows using the token as the username with an empty password
    // so that is a style of git clone URL we might encounter and we don't want to throw a "Missing password or token" error.
    // Also, we don't want to prematurely throw an error before the credentialManager plugin has
    // had an opportunity to provide the password.
    auth = calculateBasicAuthUsernamePasswordPair(auth, !!urlAuth)
    if (auth) {
      headers['Authorization'] = calculateBasicAuthHeader(auth)
    }
    const res = await http({
      onProgress,
      method: 'POST',
      url: `${url}/${service}`,
      body,
      headers
    })
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      })
    }
    return res
  }
}
