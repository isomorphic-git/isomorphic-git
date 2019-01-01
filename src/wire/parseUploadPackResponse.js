import { E, GitError } from '../models/GitError.js'
import { GitSideBand } from '../models/GitSideBand.js'
import { forAwait } from '../utils/forAwait.js'

export async function parseUploadPackResponse (stream) {
  const { packetlines, packfile, progress } = GitSideBand.demux(stream)
  let shallows = []
  let unshallows = []
  let acks = []
  let nak = false
  let done = false
  return new Promise((resolve, reject) => {
    // Parse the response
    forAwait(packetlines, data => {
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
    })
  })
}
