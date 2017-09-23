// @flow
import { Buffer } from 'buffer'
import assert from 'assert'
import PktLineReader from '../utils/pkt-line-reader'
import simpleGet from 'simple-get'
import concat from 'simple-concat'
import pify from 'pify'

function basicAuth (auth) {
  return `Basic ${Buffer.from(auth.username + ':' + auth.password).toString(
    'base64'
  )}`
}

export default class GitRemoteHTTP {
  /*::
  GIT_URL : string
  refs : Map<string, string>
  capabilities : Set<string>
  auth : { username : string, password : string }
  */
  constructor (url /*: string */) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git')) url = url += '.git'
    this.GIT_URL = url
  }
  async preparePull () {
    await this.discover('git-upload-pack')
  }
  async preparePush () {
    await this.discover('git-receive-pack')
  }
  async discover (service /*: string */) {
    this.capabilities = new Set()
    this.refs = new Map()
    let headers = {}
    // headers['Accept'] = `application/x-${service}-advertisement`
    if (this.auth) {
      headers['Authorization'] = basicAuth(this.auth)
    }
    let res = await pify(simpleGet)({
      method: 'GET',
      url: `${this.GIT_URL}/info/refs?service=${service}`,
      headers
    })
    assert(
      res.statusCode === 200,
      `Bad status code from server: ${res.statusCode}`
    )
    let data = await pify(concat)(res)
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = new PktLineReader(data)
    let lineOne = read()
    // skip past any flushes
    while (lineOne === null) lineOne = read()
    assert(lineOne !== true, 'Bad response from git server.')
    assert(
      lineOne.toString('utf8') === `# service=${service}\n`,
      lineOne.toString('utf8')
    )
    let lineTwo = read()
    // skip past any flushes
    while (lineTwo === null) lineTwo = read()
    // In the edge case of a brand new repo, zero refs (and zero capabilities)
    // are returned.
    if (lineTwo === true) return
    let [firstRef, capabilities] = lineTwo
      .toString('utf8')
      .trim()
      .split('\0')
    capabilities.split(' ').map(x => this.capabilities.add(x))
    let [ref, name] = firstRef.split(' ')
    this.refs.set(name, ref)
    while (true) {
      let line = read()
      if (line === true) break
      if (line !== null) {
        let [ref, name] = line
          .toString('utf8')
          .trim()
          .split(' ')
        this.refs.set(name, ref)
      }
    }
  }
  async push (stream) {
    const service = 'git-receive-pack'
    let headers = {}
    headers['Content-Type'] = `application/x-${service}-request`
    headers['Accept'] = `application/x-${service}-result`
    if (this.auth) {
      headers['Authorization'] = basicAuth(this.auth)
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream,
      headers
    })
    return res
  }
  async pull ({ stream, refs }) {
    const service = 'git-upload-pack'
    let headers = {}
    headers['Content-Type'] = `application/x-${service}-request`
    headers['Accept'] = `application/x-${service}-result`
    if (this.auth) {
      headers['Authorization'] = basicAuth(this.auth)
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream,
      headers
    })
    return res
  }
}
