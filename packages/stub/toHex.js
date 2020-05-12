import Hex from 'hex'

export function toHex(buffer) {
  const result = Hex.toString(buffer.buffer || buffer, '', '0123456789abcdef')
  return result
}
