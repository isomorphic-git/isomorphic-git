import { PassThrough } from 'stream'
import through2 from 'through2'

import { E, GitError } from '../models/GitError.js'
import { GitPktLine } from '../models/GitPktLine.js'

export class GitRemoteConnection {
  static async receiveInfoRefs (service, res) {
    const capabilities = new Set()
    const refs = new Map()
    const symrefs = new Map()

    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read = GitPktLine.streamReader(res)
    let lineOne = await read()
    // skip past any flushes
    while (lineOne === null) lineOne = await read()
    if (lineOne === true) throw new GitError(E.EmptyServerResponseFail)
    if (lineOne.toString('utf8') !== `# service=${service}\n`) {
      throw new GitError(E.AssertServerResponseFail, {
        expected: `# service=${service}\\n`,
        actual: lineOne.toString('utf8')
      })
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
    packstream.write(GitPktLine.flush())
    for (const oid of haves) {
      packstream.write(GitPktLine.encode(`have ${oid}\n`))
    }
    packstream.end(GitPktLine.encode(`done\n`))
    return packstream
  }

  static async receiveUploadPackResult ({ packetlines, packfile, progress }) {
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
              reject(new GitError(E.CorruptShallowOidFail, { oid }))
            }
            shallows.push(oid)
          } else if (line.startsWith('unshallow')) {
            let oid = line.slice(-41).trim()
            if (oid.length !== 40) {
              reject(new GitError(E.CorruptShallowOidFail, { oid }))
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
      // For some reason, clone --depth=1 returns >300 'shallow's but no ACK or NAK
      // This is the failsafe in case there's no ack or nak
      packetlines.on('end', () => {
        if (!done) {
          resolve({ shallows, unshallows, acks, nak, packfile, progress })
        }
      })
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

  static async receiveReceivePackResult (packfile) {
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
      throw new GitError(E.UnparseableServerResponseFail, { line })
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
}
