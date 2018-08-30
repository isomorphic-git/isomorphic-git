import pify from 'pify'
import simpleGet from 'simple-get'

import { E, GitError } from '../models/GitError.js'
import { calculateBasicAuthHeader } from '../utils/calculateBasicAuthHeader.js'
import { calculateBasicAuthUsernamePasswordPair } from '../utils/calculateBasicAuthUsernamePasswordPair.js'
import { cores } from '../utils/plugins.js'
import { pkg } from '../utils/pkg.js'

import { GitRemoteConnection } from './GitRemoteConnection.js'

// Try to accomodate known CORS proxy implementations:
// - https://jcubic.pl/proxy.php?  <-- uses query string
// - https://cors.isomorphic-git.org  <-- uses path
const corsProxify = (corsProxy, url) => corsProxy.endsWith('?')
  ? `${corsProxy}${url}`
  : `${corsProxy}/${url.replace(/^https?:\/\//, '')}`

export class GitRemoteHTTP {
  static async capabilities () {
    return ['discover', 'connect']
  }
  static async discover ({ core, corsProxy, service, url, noGitSuffix, auth }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    let {protocol, host} = new URL(url)
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
      protocol = protocol.trimEnd(':') // sheesh
      auth = await credentialManager.fill({ protocol, host })
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
        await credentialManager.rejected({ protocol, host, auth })
      } else if (res.statusCode === 200) {
        await credentialManager.approved({ protocol, host, auth })
      }
    }
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      })
    }
    let remoteHTTP = await GitRemoteConnection.receiveInfoRefs(service, res)
    remoteHTTP.auth = auth
    return remoteHTTP
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
