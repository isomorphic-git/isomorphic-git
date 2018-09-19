import pify from 'pify'
import simpleGet from 'simple-get'

import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { calculateBasicAuthUsernamePasswordPair } from '../utils/calculateBasicAuthUsernamePasswordPair.js'
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
  static async discover ({ core, corsProxy, service, url, noGitSuffix, auth }) {
    const _origUrl = url
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    if (corsProxy) {
      url = corsProxify(corsProxy, url)
    }
    let headers = {}
    // headers['Accept'] = `application/x-${service}-advertisement`
    headers['user-agent'] = pkg.agent
    let _auth = calculateBasicAuthUsernamePasswordPair(auth)
    if (_auth) {
      headers['Authorization'] = calculateBasicAuthHeader(_auth)
    }
    let res = await pify(simpleGet)({
      method: 'GET',
      url: `${url}/info/refs?service=${service}`,
      headers
    })
    if (res.statusCode === 401 && cores.get(core).has('credentialManager')) {
      // Acquire credentials and try again
      const credentialManager = cores.get(core).get('credentialManager')
      auth = await credentialManager.fill({ url: _origUrl })
      let _auth = calculateBasicAuthUsernamePasswordPair(auth)
      if (_auth) {
        headers['Authorization'] = calculateBasicAuthHeader(_auth)
      }
      res = await pify(simpleGet)({
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
      let remoteHTTP = await parseRefsAdResponse(res, { service })
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
  static async connect ({ corsProxy, service, url, noGitSuffix, auth, stream }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    if (corsProxy) {
      url = corsProxify(corsProxy, url)
    }
    let headers = {}
    headers['content-type'] = `application/x-${service}-request`
    headers['accept'] = `application/x-${service}-result`
    headers['user-agent'] = pkg.agent
    auth = calculateBasicAuthUsernamePasswordPair(auth)
    if (auth) {
      headers['Authorization'] = calculateBasicAuthHeader(auth)
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${url}/${service}`,
      body: stream,
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
