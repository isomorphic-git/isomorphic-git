// @flow
import axios from 'axios'
import assert from 'assert'
import PktLineReader from '../utils/pkt-line-reader'

export default class GitRemoteHTTP {
  /*::
  GIT_URL : string
  refs : Map<string, string>
  capabilities : Set<string>
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
    let res = await axios.get(`${this.GIT_URL}/info/refs?service=${service}`)
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = new PktLineReader(res.data)
    let lineOne = read()
    assert(lineOne.toString('utf8') === `# service=${service}\n`)
    let lineTwo = read()
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
  async push (stream /*: WritableStream */) {
    const service = 'git-receive-pack'
    let res = await axios.post(`${this.GIT_URL}/info/refs?service=${service}`, {
      data: stream,
      headers: {
        'Content-Type': 'application/x-git-receive-pack-request'
      }
    })
    assert(res.status === 200)
  }
  async pull ({ stream, refs } /*: { stream: WritableStream } */) {
    const service = 'git-upload-pack'
    let res = await axios.post(`${this.GIT_URL}/info/refs?service=${service}`, {
      data: stream,
      headers: {
        'Content-Type': 'application/x-git-receive-pack-request'
      }
    })
    assert(res.status === 200)
  }
}
