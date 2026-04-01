import { createHash } from 'crypto'

const SHA1_CHUNK_SIZE = 8 * 1024 * 1024

export async function shasumRange(
  buffer,
  { start = 0, end = buffer.length } = {}
) {
  const hash = createHash('sha1')
  for (let i = start; i < end; i += SHA1_CHUNK_SIZE) {
    hash.update(buffer.subarray(i, Math.min(i + SHA1_CHUNK_SIZE, end)))
  }
  return hash.digest('hex')
}
