// @flow
import { Buffer } from 'buffer'

/*::
type TreeEntry = {
  mode: string,
  path: string,
  oid: string,
  type?: string
}
*/

function parseBuffer (buffer) /*: Array<TreeEntry> */ {
  let _entries = []
  let cursor = 0
  while (cursor < buffer.length) {
    let space = buffer.indexOf(32, cursor)
    if (space === -1) {
      throw new Error(
        `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`
      )
    }
    let nullchar = buffer.indexOf(0, cursor)
    if (nullchar === -1) {
      throw new Error(
        `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`
      )
    }
    let mode = buffer.slice(cursor, space).toString('utf8')
    if (mode === '40000') mode = '040000' // makes it line up neater in printed output
    let type = mode === '040000' ? 'tree' : 'blob'
    let path = buffer.slice(space + 1, nullchar).toString('utf8')
    let oid = buffer.slice(nullchar + 1, nullchar + 21).toString('hex')
    cursor = nullchar + 21
    _entries.push({ mode, path, oid, type })
  }
  return _entries
}

function nudgeIntoShape (entry) {
  if (!entry.oid && entry.sha) {
    entry.oid = entry.sha // Github
  }
  if (typeof entry.mode === 'number') {
    entry.mode = entry.mode.toString(8) // index
  }
  if (!entry.type) {
    entry.type = 'blob' // index
  }
  return entry
}

export class GitTree {
  /*::
  _entries: Array<TreeEntry>
  */
  constructor (entries /*: any */) {
    if (Buffer.isBuffer(entries)) {
      this._entries = parseBuffer(entries)
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape)
    } else {
      throw new Error('invalid type passed to GitTree constructor')
    }
  }
  static from (tree) {
    return new GitTree(tree)
  }
  render () {
    return this._entries
      .map(entry => `${entry.mode} ${entry.type} ${entry.oid}    ${entry.path}`)
      .join('\n')
  }
  toObject () {
    return Buffer.concat(
      this._entries.map(entry => {
        let mode = Buffer.from(entry.mode.replace(/^0/, ''))
        let space = Buffer.from(' ')
        let path = Buffer.from(entry.path, { encoding: 'utf8' })
        let nullchar = Buffer.from([0])
        let oid = Buffer.from(entry.oid.match(/../g).map(n => parseInt(n, 16)))
        return Buffer.concat([mode, space, path, nullchar, oid])
      })
    )
  }
  entries () {
    return this._entries
  }
  * [Symbol.iterator] () {
    for (let entry of this._entries) {
      yield entry
    }
  }
}
