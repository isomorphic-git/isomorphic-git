import { PassThrough } from 'stream'

import { E, GitError, GitPktLine } from '../models'

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
  static async stream ({ res }) {
    // Parse the response!
    let read = GitPktLine.streamReader(res)
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
