import { E, GitError } from '../models/GitError.js'
import { comparePath } from '../utils/comparePath.js'

/*::
type TreeEntry = {
  mode: string,
  path: string,
  oid: string,
  type?: string
}
*/

function mode2type (mode) {
  // prettier-ignore
  switch (mode) {
    case '040000': return 'tree'
    case '100644': return 'blob'
    case '100755': return 'blob'
    case '120000': return 'blob'
    case '160000': return 'commit'
  }
  throw new GitError(E.InternalFail, {
    message: `Unexpected GitTree entry mode: ${mode}`
  })
}

function parseBuffer (buffer) {
  let _entries = []
  let cursor = 0
  while (cursor < buffer.length) {
    let space = buffer.indexOf(32, cursor)
    if (space === -1) {
      throw new GitError(E.InternalFail, {
        message: `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`
      })
    }
    let nullchar = buffer.indexOf(0, cursor)
    if (nullchar === -1) {
      throw new GitError(E.InternalFail, {
        message: `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`
      })
    }
    let mode = buffer.slice(cursor, space).toString('utf8')
    if (mode === '40000') mode = '040000' // makes it line up neater in printed output
    let type = mode2type(mode)
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
  if (mode.match(/^0?4.*/)) return '040000' // Directory
  if (mode.match(/^1006.*/)) return '100644' // Regular non-executable file
  if (mode.match(/^1007.*/)) return '100755' // Regular executable file
  if (mode.match(/^120.*/)) return '120000' // Symbolic link
  if (mode.match(/^160.*/)) return '160000' // Commit (git submodule reference)
  throw new GitError(E.InternalFail, {
    message: `Could not understand file mode: ${mode}`
  })
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
      // There appears to be an edge case (in this repo no less) where
      // the tree is NOT sorted as expected if some directories end with ".git"
      this._entries.sort(comparePath)
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape)
    } else {
      throw new GitError(E.InternalFail, {
        message: 'invalid type passed to GitTree constructor'
      })
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
