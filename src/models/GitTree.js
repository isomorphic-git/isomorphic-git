/*::
type TreeEntry = {
  mode: string,
  path: string,
  oid: string,
  type?: string
}
*/

function parseBuffer (buffer) {
  let _entries = []
  let cursor = 0
  while (cursor < buffer.length) {
    let space = buffer.indexOf(32, cursor)
    if (space === -1) {
      throw new Error(
        `GitTree.js:17 E68 GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`
      )
    }
    let nullchar = buffer.indexOf(0, cursor)
    if (nullchar === -1) {
      throw new Error(
        `GitTree.js:23 E69 GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`
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

function limitModeToAllowed (mode) {
  if (typeof mode === 'number') {
    mode = mode.toString(8)
  }
  // tree
  if (mode.match(/^0?4.*/)) return '40000' // Directory
  if (mode.match(/^1006.*/)) return '100644' // Regular non-executable file
  if (mode.match(/^1007.*/)) return '100755' // Regular executable file
  if (mode.match(/^120.*/)) return '120000' // Symbolic link
  if (mode.match(/^160.*/)) return '160000' // Commit (git submodule reference)
  throw new Error(`GitTree.js:47 E70 Could not understand file mode: ${mode}`)
}

function nudgeIntoShape (entry) {
  if (!entry.oid && entry.sha) {
    entry.oid = entry.sha // Github
  }
  entry.mode = limitModeToAllowed(entry.mode) // index
  if (!entry.type) {
    entry.type = 'blob' // index
  }
  return entry
}

export class GitTree {
  /*::
  _entries: Array<TreeEntry>
  */
  constructor (entries) {
    if (Buffer.isBuffer(entries)) {
      this._entries = parseBuffer(entries)
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape)
    } else {
      throw new Error('GitTree.js:71 E71 invalid type passed to GitTree constructor')
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
