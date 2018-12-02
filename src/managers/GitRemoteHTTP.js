import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { calculateBasicAuthUsernamePasswordPair } from '../utils/calculateBasicAuthUsernamePasswordPair.js'
import { fetch } from '../utils/fetch.js'
import { pkg } from '../utils/pkg.js'
import { cores } from '../utils/plugins.js'
import { wrapStream } from '../utils/wrapStream.js'
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
    let _auth = calculateBasicAuthUsernamePasswordPair(auth)
    if (_auth) {
      headers['Authorization'] = calculateBasicAuthHeader(_auth)
    }
    let res = await fetch(`${url}/info/refs?service=${service}`, {
      method: 'GET',
      headers
    })
    if (res.status === 401 && cores.get(core).has('credentialManager')) {
      // Acquire credentials and try again
      const credentialManager = cores.get(core).get('credentialManager')
      auth = await credentialManager.fill({ url: _origUrl })
      let _auth = calculateBasicAuthUsernamePasswordPair(auth)
      if (_auth) {
        headers['Authorization'] = calculateBasicAuthHeader(_auth)
      }
      res = await fetch(`${url}/info/refs?service=${service}`, {
        method: 'GET',
        headers
      })
      // Tell credential manager if the credentials were no good
      if (res.status === 401) {
        await credentialManager.rejected({ url: _origUrl, auth })
      } else if (res.status === 200) {
        await credentialManager.approved({ url: _origUrl, auth })
      }
    }
    if (res.status !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.status,
        statusMessage: res.statusText
      })
    }
    // I'm going to be nice and ignore the content-type requirement unless there is a problem.
    try {
      let remoteHTTP = await parseRefsAdResponse(
        Buffer.from(await res.arrayBuffer()),
        { service }
      )
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
    corsProxy,
    service,
    url,
    noGitSuffix,
    auth,
    stream,
    headers
  }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
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
    auth = calculateBasicAuthUsernamePasswordPair(auth)
    if (auth) {
      headers['Authorization'] = calculateBasicAuthHeader(auth)
    }
    let res = await fetch(`${url}/${service}`, {
      method: 'POST',
      body: await wrapStream(stream),
      headers
    })
    if (res.status !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.status,
        statusMessage: res.statusText
      })
    }
    return Buffer.from(await res.arrayBuffer())
  }
}
