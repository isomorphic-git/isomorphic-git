import { EmptyServerResponseError } from 'errors/EmptyServerResponseError'
import { ParseError } from 'errors/ParseError'
import { GitPktLine } from 'models/GitPktLine'

export async function parseRefsAdResponse(stream, { service }) {
  const capabilities = new Set()
  const refs = new Map()
  const symrefs = new Map()

  // There is probably a better way to do this, but for now
  // let's just throw the result parser inline here.
  const read = GitPktLine.streamReader(stream)
  let lineOne = await read()
  // skip past any flushes
  while (lineOne === null) lineOne = await read()
  if (lineOne === true) throw new EmptyServerResponseError()
  // Clients MUST ignore an LF at the end of the line.
  if (lineOne.toString('utf8').replace(/\n$/, '') !== `# service=${service}`) {
    throw new ParseError(`# service=${service}\\n`, lineOne.toString('utf8'))
  }
  let lineTwo = await read()
  // skip past any flushes
  while (lineTwo === null) lineTwo = await read()
  // In the edge case of a brand new repo, zero refs (and zero capabilities)
  // are returned.
  if (lineTwo === true) return { capabilities, refs, symrefs }

  const [firstRef, capabilitiesLine] = splitAndAssert(
    lineTwo,
    0,
    '\\x00'
  )
  capabilitiesLine.split(' ').map(x => capabilities.add(x))
  const [ref, name] = splitAndAssert(firstRef, ' ', ' ')
  refs.set(name, ref)
  while (true) {
    const line = await read()
    if (line === true) break
    if (line !== null) {
      const [ref, name] = splitAndAssert(line, ' '.charCodeAt(), ' ')
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

function splitAndAssert(line, sep, expected) {
  if ("string" !== typeof line) {
    const position = line.indexOf(sep);
    if ((position < 0) || (line.indexOf(sep, position + 1) >= 0)) {
		throw new ParseError(
		  `Two strings separated by '${expected}'`,
		  line.toString('utf8')
		)
	}
	return [
		String.fromArrayBuffer(line.slice(0, position).buffer).trimStart(),
		String.fromArrayBuffer(line.slice(position + 1).buffer).trimEnd(),
	];
  }

  const split = line.trim().split(sep)
  if (split.length !== 2) {
    throw new ParseError(
      `Two strings separated by '${expected}'`,
      line.toString('utf8')
    )
  }
  return split
}
