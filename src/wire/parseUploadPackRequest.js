import { GitPktLine } from '../models/GitPktLine.js'

export async function parseUploadPackRequest (stream) {
  let read = GitPktLine.streamReader(stream)
  let done = false
  let capabilities = null
  let wants = []
  let haves = []
  let shallows = []
  let depth
  let since
  let exclude = []
  let relative = false
  while (!done) {
    let line = await read()
    if (line === true) break
    if (line === null) continue
    let [key, value, ...rest] = line
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
    done
  }
}
