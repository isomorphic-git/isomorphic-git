export function padHex(b, n) {
  const s = n.toString(16)
  return '0'.repeat(b - s.length) + s
}
