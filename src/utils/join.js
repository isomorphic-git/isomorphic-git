// For some reason path.posix.join is undefined in webpack
// Also, this is just much smaller
export function join (...parts) {
  parts = parts.filter(part => part !== '' && part !== '.')
  if (parts.length === 0) return '.'

  return parts.join('/')
}
