// @flow
import axios from 'axios'
import assert from 'assert'
import PktLineReader from '../utils/pkt-line-reader'
import simpleGet from 'simple-get'
import pify from 'pify'

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
    console.log('this.auth =', this.auth)
    let res = await axios.get(`${this.GIT_URL}/info/refs?service=${service}`, {
      auth: this.auth
    })
    console.log('res =', res)
    assert(res.status === 200, `Bad status code from server: ${res.status}`)
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = new PktLineReader(res.data)
    let lineOne = read()
    assert(lineOne !== true, 'Bad response from git server.')
    console.log('lineOne =', lineOne)
    assert(
      lineOne.toString('utf8') === `# service=${service}\n`,
      lineOne.toString('utf8')
    )
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
  async push (stream /*: ReadableStream */) {
    console.log('this.auth =', this.auth)
    const service = 'git-receive-pack'
    // // Axios didn't work
    // // Superagent didn't work either
    // let req = superagent.post(`${this.GIT_URL}/${service}`)
    // req.auth(this.auth.username, this.auth.password)
    // req.accept(`application/x-${service}-result`)
    // req.type(`application/x-${service}-request`)
    // stream.pipe(req)
    // // Request works!
    // let self = this
    // return new Promise(function (resolve, reject) {
    //   let req = request(
    //     {
    //       method: 'POST',
    //       url: `${self.GIT_URL}/${service}`,
    //       auth: {
    //         user: self.auth.username,
    //         pass: self.auth.password
    //       },
    //       headers: {
    //         'Content-Type': `application/x-${service}-request`,
    //         Accept: `application/x-${service}-result`
    //       }
    //     },
    //     (err, response, body) => {
    //       if (err) return reject(err)
    //       else resolve(body)
    //     }
    //   )
    //   stream.pipe(req)
    //   console.log('req =', req)
    // })
    // // Simple-get works!
    // let self = this
    // return new Promise(function (resolve, reject) {
    //   let req = simpleGet.concat(
    //     {
    //       method: 'POST',
    //       url: `${self.GIT_URL}/${service}`,
    //       body: stream,
    //       headers: {
    //         'Content-Type': `application/x-${service}-request`,
    //         Accept: `application/x-${service}-result`,
    //         Authorization: `Basic ${Buffer.from(self.auth.username + ':' + self.auth.password).toString('base64')}`
    //       }
    //     },
    //     (err, res, body) => {
    //       console.log('res =', res)
    //       if (err) return reject(err)
    //       else resolve(body.toString())
    //     }
    //   )
    //   console.log('req =', req)
    // })
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream,
      headers: {
        'Content-Type': `application/x-${service}-request`,
        Accept: `application/x-${service}-result`,
        Authorization: `Basic ${Buffer.from(
          this.auth.username + ':' + this.auth.password
        ).toString('base64')}`
      }
    })
    console.log(res)
    return res
  }
  async pull ({ stream, refs } /*: { stream: WritableStream } */) {
    const service = 'git-upload-pack'
    let res = await axios.post(`${this.GIT_URL}/${service}`, {
      data: stream,
      headers: {
        'Content-Type': `application/x-${service}-request`,
        Accept: `application/x-${service}-result`
      },
      auth: this.auth
    })
    assert(res.status === 200)
    return res
  }
}
