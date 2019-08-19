import { E, GitError } from '../models/GitError.js'
import { GitPktLine } from '../models/GitPktLine.js'

export async function parseRefsAdResponse (stream, { service }) {
  const capabilities = new Set()
  const refs = new Map()
  const symrefs = new Map()

  // There is probably a better way to do this, but for now
  // let's just throw the result parser inline here.
  const read = GitPktLine.streamReader(stream)
  let lineOne = await read()
  // skip past any flushes
  while (lineOne === null) lineOne = await read()
  if (lineOne === true) throw new GitError(E.EmptyServerResponseFail)
  // Clients MUST ignore an LF at the end of the line.
  if (lineOne.toString('utf8').replace(/\n$/, '') !== `# service=${service}`) {
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
  const [firstRef, capabilitiesLine] = lineTwo
    .toString('utf8')
    .trim()
    .split('\x00')
  capabilitiesLine.split(' ').map(x => capabilities.add(x))
  const [ref, name] = firstRef.split(' ')
  refs.set(name, ref)
  while (true) {
    const line = await read()
    if (line === true) break
    if (line !== null) {
      const [ref, name] = line
        .toString('utf8')
        .trim()
        .split(' ')
      refs.set(name, ref)
    }
  }
  // Symrefs are thrown into the "capabilities" unfortunately.
  for (const cap of capabilities) {
    if (cap.startsWith('symref=')) {
      const m = cap.match(/symref=([^:]+):(.*)/)
      if (m.length === 3) {
        symrefs.set(m[1], m[2])
      }
    }
  }
  return { capabilities, refs, symrefs }
}
