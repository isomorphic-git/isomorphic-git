export function toHex(buffer) {
  let hex = ''
  // NOTE: Originally I used .toString(16)
  // However, I ran into upper/lower case issues and the ES2021 spec literally says
  // "The precise algorithm [of .toString(radix)] is implementation-dependent" so screw that.
  const chars = '0123456789abcdef'
  for (const byte of new Uint8Array(buffer)) {
    const i = chars[byte >> 4]
    if (i === undefined) debugger;
    hex += i
    const x = chars[byte % 16]
    if (x === undefined) debugger;
    hex += x
  }
  return hex
}
