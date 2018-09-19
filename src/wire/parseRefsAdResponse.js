import { E, GitError } from '../models/GitError.js'
import { GitPktLine } from '../models/GitPktLine.js'

export async function parseRefsAdResponse (stream, { service }) {
  const capabilities = new Set()
  const refs = new Map()
  const symrefs = new Map()

  // There is probably a better way to do this, but for now
  // let's just throw the result parser inline here.
  let read = GitPktLine.streamReader(stream)
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
