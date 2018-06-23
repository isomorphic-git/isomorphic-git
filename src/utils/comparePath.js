export function comparePath (a, b) {
  // https://stackoverflow.com/a/40355107/2168416
  return +(a.path > b.path) || -(a.path < b.path)
}
