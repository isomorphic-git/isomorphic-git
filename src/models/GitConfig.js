import fs from 'fs'
import pify from 'pify'
import ini from 'ini'
import get from 'lodash.get'

export default class GitConfig {
  constructor (gitdir) {
    this.filename = `${gitdir}/config`
  }
  async parse () {
    if (this.ini) return
    let text = await pify(fs.readFile)(this.filename, {encoding: 'utf8'})
    this.ini = ini.decode(text)
  }
  async get (path) {
    await this.parse()
    return get(this.ini, path)
  }
}