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
  async discover () {
    this.capabilities = new Set()
    this.refs = new Map()
    let res = await axios.get(
      `${this.GIT_URL}/info/refs?service=git-upload-pack`
    )
    console.log(res.data)
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = new PktLineReader(res.data)
    assert(read().toString('utf8') === '# service=git-upload-pack\n')
    let lineTwo = read()
    while (lineTwo === null) lineTwo = read()
    let [firstRef, capabilities] = lineTwo
      .toString('utf8')
      .trim()
      .split('\0')
    console.log(firstRef)
    console.log(capabilities)
    capabilities.split(' ').map(x => this.capabilities.add(x))
    console.log('this.capabilities =', this.capabilities)
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
}
