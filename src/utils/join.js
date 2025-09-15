import { normalize } from '@zenfs/core/path'

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError(
      'Path must be a string. Received ' + JSON.stringify(path)
    )
  }
}

// ZenFS does not handle "" parts the same (yet)
export function join(...args) {
  if (args.length === 0) return '.'
  let joined
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    assertPath(arg)
    if (arg.length > 0) {
      if (joined === undefined) joined = arg
      else joined += '/' + arg
    }
  }
  if (joined === undefined) return '.'
  return normalize(joined)
}
