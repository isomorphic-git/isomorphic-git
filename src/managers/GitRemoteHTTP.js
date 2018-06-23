import pify from 'pify'
import simpleGet from 'simple-get'

import { E, GitError } from '../models'
import {
  calculateBasicAuthHeader,
  calculateBasicAuthUsernamePasswordPair,
  pkg
} from '../utils'

import { GitRemoteConnection } from './GitRemoteConnection'

export class GitRemoteHTTP {
  static async capabilities () {
    return ['discover', 'connect']
  }
  static async discover ({ service, url, noGitSuffix, auth }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
    let headers = {}
    // headers['Accept'] = `application/x-${service}-advertisement`
    headers['user-agent'] = pkg.agent
    auth = calculateBasicAuthUsernamePasswordPair(auth)
    if (auth) {
      headers['Authorization'] = calculateBasicAuthHeader(auth)
    }
    let res = await pify(simpleGet)({
      method: 'GET',
      url: `${url}/info/refs?service=${service}`,
      headers
    })
    if (res.statusCode !== 200) {
      throw new GitError(E.HTTPError, {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      })
    }
    return GitRemoteConnection.receiveInfoRefs(service, res)
  }
  static async connect ({ service, url, noGitSuffix, auth, stream }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git') && !noGitSuffix) url = url += '.git'
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
    return GitRemoteConnection.stream({ res })
  }
}
