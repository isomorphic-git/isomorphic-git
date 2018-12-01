export function basename (path) {
  let last = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  if (last > -1) {
    path = path.slice(last + 1)
  }
  return path
}
