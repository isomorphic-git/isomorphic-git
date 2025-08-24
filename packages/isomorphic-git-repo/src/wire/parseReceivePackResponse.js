import '../typedefs.js'

import { ParseError } from '../errors/ParseError.js'
import { GitPktLine } from '../models/GitPktLine.js'

export async function parseReceivePackResponse(packfile) {
  /** @type PushResult */
  const result = {}
  let response = ''
  const read = GitPktLine.streamReader(packfile)
  let line = await read()
  while (line !== true) {
    if (line !== null) response += line.toString('utf8') + '\n'
    line = await read()
  }

  const lines = response.toString('utf8').split('\n')
  // We're expecting "unpack {unpack-result}"
  line = lines.shift()
  if (!line.startsWith('unpack ')) {
    throw new ParseError('unpack ok" or "unpack [error message]', line)
  }
  result.ok = line === 'unpack ok'
  if (!result.ok) {
    result.error = line.slice('unpack '.length)
  }
  result.refs = {}
  for (const line of lines) {
    if (line.trim() === '') continue
    const status = line.slice(0, 2)
    const refAndMessage = line.slice(3)
    let space = refAndMessage.indexOf(' ')
    if (space === -1) space = refAndMessage.length
    const ref = refAndMessage.slice(0, space)
    const error = refAndMessage.slice(space + 1)
    result.refs[ref] = {
      ok: status === 'ok',
      error,
    }
  }
  return result
}
