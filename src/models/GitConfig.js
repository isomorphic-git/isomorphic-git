import fs from 'fs'
import pify from 'pify'
import ini from 'ini'
import get from 'lodash.get'

export default class GitConfig {
  constructor (dir) {
    this.root = dir
    this.path = dir + '/.git/config'
  }
  async parse () {
    if (this.ini) return
    let text = await pify(fs.readFile)(this.path, {encoding: 'utf8'})
    this.ini = ini.decode(text)
  }
  async get (path) {
    await this.parse()
    return get(this.ini, path)
  }
}