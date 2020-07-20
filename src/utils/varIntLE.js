const MAX_SAFE_INT32 = Math.pow(2, 31)

export function writeVarIntLE(writeUInt8, val) {
  if (val > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`value exceeds Number.MAX_SAFE_INTEGER`)
  }
  const output = []

  do {
    let byte = val & 0b01111111
    if (val < MAX_SAFE_INT32) {
      val >>>= 7
    } else {
      val = (val - byte) / 128
    }
    if (val) {
      byte |= 0b10000000
    }
    writeUInt8(byte)
  } while (val)

  return output
}

export function readVarIntLE(readUInt8) {
  let result = 0
  let shift = 0
  let byte = 0
  do {
    byte = readUInt8()
    if (shift + 7 <= 32) {
      result |= (byte & 0b01111111) << shift
    } else {
      result += (byte & 0b01111111) * Math.pow(2, shift)
      if (result > Number.MAX_SAFE_INTEGER) {
        throw new RangeError(`value exceeds Number.MAX_SAFE_INTEGER`)
      }
    }
    shift += 7
  } while (byte & 0b10000000)
  return result
}
