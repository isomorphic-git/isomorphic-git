import { GitPktLine } from '../models/GitPktLine.js'

export async function parseUploadPackRequest(stream) {
  const read = GitPktLine.streamReader(stream)
  let done = false
  let capabilities = null
  const wants = []
  const haves = []
  const shallows = []
  let depth
  let since
  const exclude = []
  let relative = false
  while (!done) {
    const line = await read()
    if (line === true) break
    if (line === null) continue
    const [key, value, ...rest] = line
      .toString('utf8')
      .trim()
      .split(' ')
    if (!capabilities) capabilities = rest
    switch (key) {
      case 'want':
        wants.push(value)
        break
      case 'have':
        haves.push(value)
        break
      case 'shallow':
        shallows.push(value)
        break
      case 'deepen':
        depth = parseInt(value)
        break
      case 'deepen-since':
        since = parseInt(value)
        break
      case 'deepen-not':
        exclude.push(value)
        break
      case 'deepen-relative':
        relative = true
        break
      case 'done':
        done = true
        break
    }
  }
  return {
    capabilities,
    wants,
    haves,
    shallows,
    depth,
    since,
    exclude,
    relative,
    done,
  }
}
