// For some reason path.posix.join is undefined in webpack
// Also, this is just much smaller
import { normalizePath } from './normalizePath.js'

export function join(...parts) {
  return normalizePath(parts.map(normalizePath).join('/'))
}
