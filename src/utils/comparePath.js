import { compareStrings } from './compareStrings.js'

export function comparePath(a, b) {
  // https://stackoverflow.com/a/40355107/2168416
  return compareStrings(a.path, b.path)
}
