import { Digest } from 'crypt'

// prototype class for hash functions
export default class Hash {
  constructor() {
    this.sha1 = new Digest('SHA1')
  }

  update(data) {
    this.sha1.write(data)
    return this
  }

  digest() {
    return this.sha1.close()
  }
}
