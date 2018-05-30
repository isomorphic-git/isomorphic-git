import { PassThrough } from 'stream'
import through2 from 'through2'

import { GitPktLine, GitSideBand } from '../models'
import { pkg } from '../utils'

export class GitRemoteConnection {
  static async sendInfoRefs (service, res, { capabilities, refs, symrefs }) {
    // Compose capabilities string
    let syms = ''
    for (const [key, value] of symrefs) {
      syms += `symref=${key}:${value} `
    }
    let caps = `\0${[...capabilities].join(' ')} ${syms}agent=${pkg.agent}`

    res.write(GitPktLine.encode(`# service=${service}\n`))
    res.write(GitPktLine.flush())
    // Note: In the edge case of a brand new repo, zero refs (and zero capabilities)
    // are returned.
    for (const [key, value] of refs) {
      res.write(GitPktLine.encode(`${value} ${key}${caps}\n`))
      caps = ''
    }
    res.write(GitPktLine.flush())
    res.end()
  }
  static async receiveInfoRefs (service, res) {
    const capabilities = new Set()
    const refs = new Map()
    const symrefs = new Map()

    let read = GitPktLine.streamReader(res)
    let lineOne = await read()
    // skip past any flushes
    while (lineOne === null) lineOne = await read()
    if (lineOne === true) throw new Error('Bad response from git server.')
    if (lineOne.toString('utf8') !== `# service=${service}\n`) {
      throw new Error(
        `Expected '# service=${service}\\n' but got '${lineOne.toString(
          'utf8'
        )}'`
      )
    }
    let lineTwo = await read()
    // skip past any flushes
    while (lineTwo === null) lineTwo = await read()
    // In the edge case of a brand new repo, zero refs (and zero capabilities)
    // are returned.
    if (lineTwo === true) return { capabilities, refs, symrefs }
    let [firstRef, capabilitiesLine] = lineTwo
      .toString('utf8')
      .trim()
      .split('\0')
    capabilitiesLine.split(' ').map(x => capabilities.add(x))
    let [ref, name] = firstRef.split(' ')
    refs.set(name, ref)
    while (true) {
      let line = await read()
      if (line === true) break
      if (line !== null) {
        let [ref, name] = line
          .toString('utf8')
          .trim()
          .split(' ')
        refs.set(name, ref)
      }
    }
    // Symrefs are thrown into the "capabilities" unfortunately.
    for (let cap of capabilities) {
      if (cap.startsWith('symref=')) {
        let m = cap.match(/symref=([^:]+):(.*)/)
        if (m.length === 3) {
          symrefs.set(m[1], m[2])
        }
      }
    }
    return { capabilities, refs, symrefs }
  }
  static async sendUploadPackRequest ({
    capabilities = [],
    wants = [],
    haves = [],
    shallows = [],
    depth = null,
    since = null,
    exclude = [],
    relative = false
  }) {
    let packstream = new PassThrough()
    wants = [...new Set(wants)] // remove duplicates
    let firstLineCapabilities = ` ${capabilities.join(' ')}`
    for (const oid of wants) {
      packstream.write(
        GitPktLine.encode(`want ${oid}${firstLineCapabilities}\n`)
      )
      firstLineCapabilities = ''
    }
    for (const oid of shallows) {
      packstream.write(GitPktLine.encode(`shallow ${oid}\n`))
    }
    if (depth !== null) {
      packstream.write(GitPktLine.encode(`deepen ${depth}\n`))
    }
    if (since !== null) {
      packstream.write(
        GitPktLine.encode(
          `deepen-since ${Math.floor(since.valueOf() / 1000)}\n`
        )
      )
    }
    for (const oid of exclude) {
      packstream.write(GitPktLine.encode(`deepen-not ${oid}\n`))
    }
    for (const oid of haves) {
      packstream.write(GitPktLine.encode(`have ${oid}\n`))
    }
    packstream.write(GitPktLine.flush())
    packstream.end(GitPktLine.encode(`done\n`))
    return packstream
  }
  static async receiveUploadPackRequest (req) {
    let read = GitPktLine.streamReader(req)
    let done = false
    let capabilities = null
    let wants = []
    let haves = []
    let shallows = []
    let depth
    let since
    let exclude = []
    let relative = false
    while (!done) {
      let line = await read()
      if (line === true) break
      if (line === null) continue
      let [key, value, ...rest] = line
        .toString('utf8')
        .trim()
        .split(' ')
      if (!capabilities) capabilities = rest
      switch (key) {
        case 'want':
          wants.push(value)
          break
        case 'have':
          haves.push(value)
          break
        case 'shallow':
          shallows.push(value)
          break
        case 'deepen':
          depth = parseInt(value)
          break
        case 'deepen-since':
          since = parseInt(value)
          break
        case 'deepen-not':
          exclude.push(value)
          break
        case 'deepen-relative':
          relative = true
          break
        case 'done':
          done = true
          break
      }
    }
    return {
      capabilities,
      wants,
      haves,
      shallows,
      depth,
      since,
      exclude,
      relative,
      done
    }
  }
  static async sendUploadPackResult ({
    packetlines,
    packfile,
    progress,
    error,
    protocol = 'side-band-64k',
    shallows = [],
    unshallows = [],
    acks = []
  }) {
    let stream = GitSideBand.mux({
      protocol,
      packetlines,
      packfile,
      progress,
      error
    })
    if (shallows.length || shallows.size || unshallows.length || unshallows.size) {
      stream.write(GitPktLine.flush())
    }
    for (const shallow of shallows) {
      packetlines.write(`shallow ${shallow}\n`)
      console.log(`shallow ${shallow}\n`)
    }
    for (const unshallow of unshallows) {
      packetlines.write(`unshallow ${unshallow}\n`)
      console.log(`unshallow ${unshallow}\n`)
    }
    if (shallows.length || shallows.size || unshallows.length || unshallows.size) {
      stream.write(GitPktLine.flush())
    }
    for (const ack of acks) {
      packetlines.write(`ACK ${ack.oid}${ack.status ? (' ' + ack.status) : ''}\n`)
      console.log(`ACK ${ack.oid}${ack.status ? (' ' + ack.status) : ''}\n`)
    }
    if (acks.length === 0 || acks.size === 0) {
      packetlines.write(`NAK\n`)
      console.log(`NAK\n`)
    }
    return stream
  }
  static async receiveUploadPackResult (res) {
    let { packetlines, packfile, progress } = GitSideBand.demux(res)
    let shallows = []
    let unshallows = []
    let acks = []
    let nak = false
    let done = false
    return new Promise((resolve, reject) => {
      // Parse the response
      packetlines.pipe(
        through2(async (data, enc, next) => {
          let line = data.toString('utf8').trim()
          if (line.startsWith('shallow')) {
            let oid = line.slice(-41).trim()
            if (oid.length !== 40) {
              reject(new Error(`non-40 character 'shallow' oid: ${oid}`))
            }
            shallows.push(oid)
          } else if (line.startsWith('unshallow')) {
            let oid = line.slice(-41).trim()
            if (oid.length !== 40) {
              reject(new Error(`non-40 character 'shallow' oid: ${oid}`))
            }
            unshallows.push(oid)
          } else if (line.startsWith('ACK')) {
            let [, oid, status] = line.split(' ')
            acks.push({ oid, status })
            if (!status) done = true
          } else if (line.startsWith('NAK')) {
            nak = true
            done = true
          }
          if (done) {
            resolve({ shallows, unshallows, acks, nak, packfile, progress })
          }
          next(null, data)
        })
      )
    })
  }
  static async sendReceivePackRequest ({ capabilities = [], triplets = [] }) {
    let packstream = new PassThrough()
    let capsFirstLine = `\0 ${capabilities.join(' ')}`
    for (let trip of triplets) {
      packstream.write(
        GitPktLine.encode(
          `${trip.oldoid} ${trip.oid} ${trip.fullRef}${capsFirstLine}\n`
        )
      )
      capsFirstLine = ''
    }
    packstream.write(GitPktLine.flush())
    return packstream
  }
  static async receiveReceivePackRequest () {
    // TODO
  }
  static async sendReceivePackResult () {
    // TODO
  }
  static async receiveReceivePackResult (packfile) {
    // Parse the response!
    let result = {}
    let response = ''
    let read = GitPktLine.streamReader(packfile)
    let line = await read()
    while (line !== true) {
      if (line !== null) response += line.toString('utf8') + '\n'
      line = await read()
    }

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
    return result
  }
  static async receiveMultiplexedStreams (res) {
    return GitSideBand.demux(res)
  }
}
