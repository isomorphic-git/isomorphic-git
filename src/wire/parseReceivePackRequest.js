import { E, GitError } from '../models/GitError.js'
import { GitPktLine } from '../models/GitPktLine.js'

[{ oldoid, oid, fullRef: fullRemoteRef }]

/**
 * @typedef {Object} RefUpdateRequest
 * @property {string} oldoid
 * @property {string} oid
 * @property {string} fullRef
 */

/**
 *
 * @typedef {Object} ReceivePackRequest - The object returned has the following schema:
 * @property {string[]} capabilities
 * @property {RefUpdateRequest[]} updates
 *
 */

export async function parseReceivePackRequest (stream) {
  const read = GitPktLine.streamReader(stream)
  let line = await read()
  let capabilities
  ;[line, capabilities] = line.toString('utf8').split('\0')
  capabilities = capabilities.split(' ')
  let updates = []
  while (line !== null) {
    let [oldoid, oid, fullRef] = line.toString('utf8').split(' ')
    updates.push({ oldoid, oid, fullRef })
    line = await read()
  }
  return {
    capabilities,
    updates,
    packfile: await read({ rawIterator: true })
  }
}
