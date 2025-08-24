export function toHex(buffer) {
  let hex = ''
  for (const byte of new Uint8Array(buffer)) {
    if (byte < 16) hex += '0'
    hex += byte.toString(16)
  }
  return hex
}
