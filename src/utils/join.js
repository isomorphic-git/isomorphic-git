import { normalize } from './path.js'

export function join(...parts) {
  let normalizedPath = normalize(parts.map(normalize).join('/'))

  if (normalizedPath === './') {
    normalizedPath = '.'
  }

  return normalizedPath
}
