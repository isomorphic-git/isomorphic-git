/** @type {Array<[string, number[]]>} */
export const corruptZlibCases = [
  ['empty', []],
  ['invalid header', [0, 0]],
  ['invalid checksum', [0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00]],
]
