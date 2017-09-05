import ini from 'ini'
import get from 'lodash.get'

export default class GitConfig {
  constructor (text) {
    this.ini = ini.decode(text)
  }
  static from (text) {
    return new GitConfig(text)
  }
  async get (path) {
    return get(this.ini, path)
  }
}
