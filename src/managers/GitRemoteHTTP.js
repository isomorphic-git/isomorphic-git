import pify from 'pify'
import simpleGet from 'simple-get'

import { pkg } from '../utils'

import { GitRemoteConnection } from './GitRemoteConnection'

function basicAuth (auth) {
  return `Basic ${Buffer.from(auth.username + ':' + auth.password).toString(
    'base64'
  )}`
}

export class GitRemoteHTTP {
  static async capabilities () {
    return ['discover', 'connect']
  }
  static async discover ({ service, url, auth }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git')) url = url += '.git'
    let headers = {}
    // headers['Accept'] = `application/x-${service}-advertisement`
    headers['user-agent'] = `git/${pkg.name}@${pkg.version}`
    if (auth) {
      headers['Authorization'] = basicAuth(auth)
    }
    let res = await pify(simpleGet)({
      method: 'GET',
      url: `${url}/info/refs?service=${service}`,
      headers
    })
    if (res.statusCode !== 200) {
      throw new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}`)
    }
    return GitRemoteConnection.discover(service, res)
  }
  static async connect ({ service, url, auth, stream }) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git')) url = url += '.git'
    let headers = {}
    headers['content-type'] = `application/x-${service}-request`
    headers['accept'] = `application/x-${service}-result`
    headers['user-agent'] = `git/${pkg.name}@${pkg.version}`
    if (auth) {
      headers['authorization'] = basicAuth(auth)
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${url}/${service}`,
      body: stream,
      headers
    })
    if (res.statusCode !== 200) {
      throw new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}`)
    }
    return GitRemoteConnection.stream({ res })
  }
}
