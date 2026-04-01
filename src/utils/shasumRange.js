import { shasum } from './shasum.js'

export async function shasumRange(
  buffer,
  { start = 0, end = buffer.length } = {}
) {
  return shasum(buffer.subarray(start, end))
}
