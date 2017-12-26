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

/** @ignore */
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
          this.symrefs.set(m[1], m[2])
        }
      }
    }
  }
  async push (stream /*: ReadableStream */) {
    const service = 'git-receive-pack'
    let { packetlines, packfile } = await this.stream({
      stream,
      service
    })
    // TODO: Someday, maybe we will make this a streaming parser.
    packfile = await pify(concat)(packfile)
    packetlines = await pify(concat)(packetlines)
    let result = {}
    // Parse the response!
    // I'm combining the side-band-64k and regular streams
    // because Github returns the first line in the sideband while
    // git-http-server returns it without the sideband.
    let response = ''
    let read = GitPktLine.reader(packfile)
    let line = await read()
    while (line !== null && line !== true) {
      response += line.toString('utf8') + '\n'
      line = await read()
    }
    response += packetlines.toString('utf8')

    let lines = response.toString('utf8').split('\n')
    // We're expecting "unpack {unpack-result}"
    line = lines.shift()
    if (!line.startsWith('unpack ')) {
      throw new Error(
        `Unparsable response from server! Expected 'unpack ok' or 'unpack [error message]' but got '${line}'`
      )
    }
    if (line === 'unpack ok') {
      result.ok = ['unpack']
    } else {
      result.errors = [line.trim()]
    }
    for (let line of lines) {
      let status = line.slice(0, 2)
      let refAndMessage = line.slice(3)
      if (status === 'ok') {
        result.ok = result.ok || []
        result.ok.push(refAndMessage)
      } else if (status === 'ng') {
        result.errors = result.errors || []
        result.errors.push(refAndMessage)
      }
    }
    console.log(result)
    return result
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
    let data = await pify(concat)(res)
    // Parse the response!
    let read = GitPktLine.reader(data)
    // And now for the ridiculous side-band-64k protocol
    let packetlines = new PassThrough()
    let packfile = new PassThrough()
    let progress = new PassThrough()
    // TODO: Use a proper through stream?
    const nextBit = async function () {
      let line = await read()
      // Skip over flush packets
      if (line === null) return nextBit()
      // A made up convention to signal there's no more to read.
      if (line === true) {
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
  }
}
