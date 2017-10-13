// @flow
import { Buffer } from 'buffer'
import { GitPktLine } from '../models'
import simpleGet from 'simple-get'
import concat from 'simple-concat'
import pify from 'pify'
import { pkg } from '../utils'
import { PassThrough } from 'stream'

function basicAuth (auth) {
  return `Basic ${Buffer.from(auth.username + ':' + auth.password).toString(
    'base64'
  )}`
}

export class GitRemoteHTTP {
  /*::
  GIT_URL : string
  refs : Map<string, string>
  symrefs : Map<string, string>
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
    this.symrefs = new Map()
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
    if (res.statusCode !== 200) {
      throw new Error(`Bad status code from server: ${res.statusCode}`)
    }
    let data = await pify(concat)(res)
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = GitPktLine.reader(data)
    let lineOne = read()
    // skip past any flushes
    while (lineOne === null) lineOne = read()
    if (lineOne === true) throw new Error('Bad response from git server.')
    if (lineOne.toString('utf8') !== `# service=${service}\n`) {
      throw new Error(
        `Expected '# service=${service}\\n' but got '${lineOne.toString(
          'utf8'
        )}'`
      )
    }
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
    // Symrefs are thrown into the "capabilities" unfortunately.
    for (let cap of this.capabilities) {
      if (cap.startsWith('symref=')) {
        let m = cap.match(/symref=([^:]+):(.*)/)
        if (m.length === 3) {
          this.symrefs.set(m[1], `ref: ${m[2]}`)
        }
      }
    }
  }
  async push (stream /*: ReadableStream */) {
    const service = 'git-receive-pack'
    let res = await this.stream({ stream, service })
    return res
  }
  async pull (stream /*: ReadableStream */) {
    const service = 'git-upload-pack'
    let res = await this.stream({ stream, service })
    return res
  }
  async stream ({
    stream,
    service
  }) /*: Promise<{ packfile: ReadableStream, progress: ReadableStream }> */ {
    let headers = {}
    headers['content-type'] = `application/x-${service}-request`
    headers['accept'] = `application/x-${service}-result`
    headers['user-agent'] = `git/${pkg.name}@${pkg.version}`
    if (this.auth) {
      headers['authorization'] = basicAuth(this.auth)
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream,
      headers
    })
    // Don't try to parse git pushes for now.
    if (service === 'git-receive-pack') return res
    // Parse the response!
    let read = GitPktLine.streamReader(res)
    // And now for the ridiculous side-band-64k protocol
    let packetlines = new PassThrough()
    let packfile = new PassThrough()
    let progress = new PassThrough()
    // TODO: Use a proper through stream?
    const nextBit = async function () {
      let line = await read()
      // A made up convention to signal there's no more to read.
      if (line === null) {
        packetlines.end()
        progress.end()
        packfile.end()
        return
      }
      // Examine first byte to determine which output "stream" to use
      switch (line[0]) {
        case 1: // pack data
          packfile.write(line.slice(1))
          break
        case 2: // progress message
          progress.write(line.slice(1))
          break
        case 3: // fatal error message just before stream aborts
          let error = line.slice(1)
          progress.write(error)
          packfile.destroy(new Error(error.toString('utf8')))
          return
        default:
          // Not part of the side-band-64k protocol
          packetlines.write(line.slice(0))
      }
      // Careful not to blow up the stack.
      // I think Promises in a tail-call position should be OK.
      nextBit()
    }
    nextBit()
    return {
      packetlines,
      packfile,
      progress
    }
  } /*: {
    stream: ReadableStream,
    service: string
  } */
}
