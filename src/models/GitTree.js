export default class GitTree {
  constructor (entries) {
    this._entries = entries
  }
  render () {
    return this._entries.map(entry => `${entry.mode} ${entry.type} ${entry.sha}    ${entry.path}`).join('\n')
  }
  toObject () {
    return Buffer.concat(this._entries.map(entry => {
      let mode = Buffer.from(entry.mode.replace(/^0/,''))
      let space = Buffer.from(' ')
      let path = Buffer.from(entry.path, {encoding: 'utf8'})
      let nullchar = Buffer.from([0])
      let oid = Buffer.from(entry.sha.match(/../g).map(n => parseInt(n, 16)))
      return Buffer.concat([mode, space, path, nullchar, oid])
    }))
  }
}