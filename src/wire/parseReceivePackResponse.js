import { E, GitError } from '../models/GitError.js'
import { GitPktLine } from '../models/GitPktLine.js'

export async function parseReceivePackResponse (packfile) {
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
    throw new GitError(E.UnparseableServerResponseFail, { line })
  }
  if (line === 'unpack ok') {
    result.ok = ['unpack']
  } else {
    result.errors = [line.trim()]
  }
  for (const line of lines) {
    const status = line.slice(0, 2)
    const refAndMessage = line.slice(3)
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
