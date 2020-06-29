import { GitPktLine } from '../models/GitPktLine.js'

/**
 * @typedef {Object} ServerRef - This object has the following schema:
 * @property {string} ref - The name of the ref
 * @property {string} oid - The SHA-1 object id the ref points to
 * @property {string} [target] - The target ref pointed to by a symbolic ref
 * @property {string} [peeled] - If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
 */

export async function parseListRefsResponse(stream) {
  const read = GitPktLine.streamReader(stream)

  // TODO: when we re-write everything to minimize memory usage,
  // we could make this a generator
  const refs = []

  let line
  while (true) {
    line = await read()
    if (line === true) break
    if (line === null) continue
    line = line.toString('utf8').replace(/\n$/, '')
    const [oid, ref, ...attrs] = line.split(' ')
    const r = { ref, oid }
    for (const attr of attrs) {
      const [name, value] = attr.split(':')
      if (name === 'symref-target') {
        r.target = value
      } else if (name === 'peeled') {
        r.peeled = value
      }
    }
    refs.push(r)
  }

  return refs
}
