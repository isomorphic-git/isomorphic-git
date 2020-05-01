// For some reason path.posix.join is undefined in webpack
// Also, this is just much smaller
import { normalizePath } from 'utils/normalizePath'

export function join(...parts) {
  return normalizePath(parts.map(normalizePath).join('/'))
}
