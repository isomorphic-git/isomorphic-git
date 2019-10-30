import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { calculateBasicAuthUsernamePasswordPair } from '../utils/calculateBasicAuthUsernamePasswordPair.js'
import { extractAuthFromUrl } from '../utils/extractAuthFromUrl.js'
import { http as builtinHttp } from '../utils/http.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
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

  static async discover ({
    core,
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
    // Get the 'http' plugin
    const http = cores.get(core).get('http') || builtinHttp
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
      core,
      method: 'GET',
      url: `${url}/info/refs?service=${service}`,
      headers
    })
    if (res.statusCode === 401 && cores.get(core).has('credentialManager')) {
      // Acquire credentials and try again
      const credentialManager = cores.get(core).get('credentialManager')
      auth = await credentialManager.fill({ url: _origUrl })
      const _auth = calculateBasicAuthUsernamePasswordPair(auth)
      if (_auth) {
        headers['Authorization'] = calculateBasicAuthHeader(_auth)
      }
      res = await http({
        core,
        method: 'GET',
        url: `${url}/info/refs?service=${service}`,
        headers
      })
      // Tell credential manager if the credentials were no good
      if (res.statusCode === 401) {
        await credentialManager.rejected({ url: _origUrl, auth })
      } else if (res.statusCode === 200) {
        await credentialManager.approved({ url: _origUrl, auth })
      }
    }
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      })
    }
    // I'm going to be nice and ignore the content-type requirement unless there is a problem.
    try {
      const remoteHTTP = await parseRefsAdResponse(res.body, {
        service
      })
      remoteHTTP.auth = auth
      return remoteHTTP
    } catch (err) {
      // Detect "dumb" HTTP protocol responses and throw more specific error message
      if (
        err.code === E.AssertServerResponseFail &&
        err.data.expected === `# service=${service}\\n` &&
        res.headers['content-type'] !== `application/x-${service}-advertisement`
      ) {
        // Ooooooh that's why it failed.
        throw new GitError(E.RemoteDoesNotSupportSmartHTTP, {})
      }
      throw err
    }
  }

  static async connect ({
    core,
    emitter,
    emitterPrefix,
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
    // Get the 'http' plugin
    const http = cores.get(core).get('http') || builtinHttp
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
      core,
      emitter,
      emitterPrefix,
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
