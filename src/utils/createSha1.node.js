import { createHash } from 'crypto'

export function createSha1() {
  return createHash('sha1')
}
