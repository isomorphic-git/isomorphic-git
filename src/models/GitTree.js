function parseBuffer (buffer) {
  let _entries = []
  let cursor = 0
  while (cursor < buffer.length) {
    let space = buffer.indexOf(32, cursor)
    // TODO: assert space > -1
    let nullchar = buffer.indexOf(0, cursor)
    // TODO: assert nullchar > -1
    let mode = buffer.slice(cursor, space).toString('utf8')
    if (mode === '40000') mode = '040000' // makes it line up neater in printed output
    let path = buffer.slice(space + 1, nullchar).toString('utf8')
    let oid = buffer.slice(nullchar + 1, nullchar + 21).toString('hex')
    cursor = nullchar + 21
    _entries.push({mode, path, sha: oid})
  }
  return _entries
}

export default class GitTree {
  constructor (entries) {
    if (Buffer.isBuffer(entries)) {
      this._entries = parseBuffer(entries)
    } else if (Array.isArray(entries)) {
      this._entries = entries
    } else {
      throw new Error('invalid type passed to GitTree constructor')
    }
  }
  static from (tree) {
    return new GitTree(tree)
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
