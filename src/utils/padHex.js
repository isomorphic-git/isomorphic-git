export function padHex (b, n) {
  let s = n.toString(16)
  return '0'.repeat(b - s.length) + s
}
