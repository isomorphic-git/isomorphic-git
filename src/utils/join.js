import { path } from './path.js'

export function join(...parts) {
  let normalizedPath = path.join(...parts.map(path.normalize))

  if (normalizedPath === './') {
    normalizedPath = '.'
  }

  return normalizedPath
}
