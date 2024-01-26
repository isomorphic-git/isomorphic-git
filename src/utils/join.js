const { normalize } = require('path').posix || require('path')

export function join(...parts) {
  let normalizedPath = normalize(parts.map(normalize).join('/'))

  if (normalizedPath === './') {
    normalizedPath = '.'
  }

  return normalizedPath
}
