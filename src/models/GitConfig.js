import ini from 'ini'
import get from 'lodash/get'
import set from 'lodash/set'
import unset from 'lodash/unset'

const complexKeys = ['remote', 'branch']

const isComplexKey = key =>
  complexKeys.reduce((x, y) => x || key.startsWith(y), false)

const splitComplexKey = key =>
  key
    .split('"')
    .map(x => x.trim())
    .filter(x => x !== '')

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
export class GitConfig {
  constructor (text) {
    this.ini = ini.decode(text)
    // Some mangling to make it easier to work with (honestly)
    for (let key of Object.keys(this.ini)) {
      if (isComplexKey(key)) {
        let parts = splitComplexKey(key)
        if (parts.length === 2) {
          // just to be cautious
          set(this.ini, [parts[0], parts[1]], this.ini[key])
          delete this.ini[key]
        }
      }
    }
  }
  static from (text) {
    return new GitConfig(text)
  }
  async get (path) {
    return get(this.ini, path)
  }
  async set (path, value) {
    console.log('path =', path)
    console.log('value =', value)
    if (value === undefined) {
      unset(this.ini, path)
    } else {
      set(this.ini, path, value)
    }
  }
  toString () {
    // de-mangle complex keys
    for (let key of Object.keys(this.ini)) {
      if (isComplexKey(key)) {
        for (let childkey of Object.keys(this.ini[key])) {
          let complexkey = `${key} "${childkey}"`
          this.ini[complexkey] = this.ini[key][childkey]
          delete this.ini[key][childkey]
        }
        delete this.ini[key]
      }
    }
    let text = ini.encode(this.ini, { whitespace: true })
    return text
  }
}
