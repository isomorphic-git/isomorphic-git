import Hash from 'sha.js/sha1.js'

export function createSha1() {
  return new Hash()
}
