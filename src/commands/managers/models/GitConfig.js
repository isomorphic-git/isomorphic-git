import ini from 'ini'
import get from 'lodash/get'
import set from 'lodash/set'

export class GitConfig {
  constructor (text) {
    this.ini = ini.decode(text)
  }
  static from (text) {
    return new GitConfig(text)
  }
  async get (path) {
    return get(this.ini, path)
  }
  async set (path, value) {
    return set(this.ini, path, value)
  }
  toString () {
    return ini.encode(this.ini, { whitespace: true })
  }
}
