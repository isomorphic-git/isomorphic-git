import { InvalidOidError } from '../errors/InvalidOidError.js'
import { GitSideBand } from '../models/GitSideBand.js'
import { forAwait } from '../utils/forAwait.js'

export async function parseUploadPackResponse(stream) {
  const { packetlines, packfile, progress } = GitSideBand.demux(stream)
  const shallows = []
  const unshallows = []
  const acks = []
  let nak = false
  let done = false
  return new Promise((resolve, reject) => {
    // Parse the response
    forAwait(packetlines, data => {
      const line = data.toString('utf8').trim()
      if (line.startsWith('shallow')) {
        const oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          reject(new InvalidOidError(oid))
        }
        shallows.push(oid)
      } else if (line.startsWith('unshallow')) {
        const oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          reject(new InvalidOidError(oid))
        }
        unshallows.push(oid)
      } else if (line.startsWith('ACK')) {
        const [, oid, status] = line.split(' ')
        acks.push({ oid, status })
        if (!status) done = true
      } else if (line.startsWith('NAK')) {
        nak = true
        done = true
      } else {
        done = true
        nak = true
      }
      if (done) {
        stream.error
          ? reject(stream.error)
          : resolve({ shallows, unshallows, acks, nak, packfile, progress })
      }
    }).finally(() => {
      if (!done) {
        stream.error
          ? reject(stream.error)
          : resolve({ shallows, unshallows, acks, nak, packfile, progress })
      }
    })
  })
}
