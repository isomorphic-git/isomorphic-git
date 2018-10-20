// For some reason path.posix.join is undefined in webpack
// Also, this is just much smaller
export function pathjoin (prefix, filename) {
  if (!prefix || prefix === '.') {
    if (prefix === '.' && !filename) return '.'
    return filename
  }
  if (!filename || filename === '.') {
    return prefix
  }
  return `${prefix}/${filename}`
}
