import { E, GitError } from '../models/GitError.js'
import { formatAuthor } from '../utils/formatAuthor.js'
import { normalizeNewlines } from '../utils/normalizeNewlines.js'
import { parseAuthor } from '../utils/parseAuthor.js'

function indent (str) {
  return (
    str
      .trim()
      .split('\n')
      .map(x => ' ' + x)
      .join('\n') + '\n'
  )
}

function outdent (str) {
  return str
    .split('\n')
    .map(x => x.replace(/^ /, ''))
    .join('\n')
}

export class GitCommit {
  constructor (commit) {
    if (typeof commit === 'string') {
      this._commit = commit
    } else if (Buffer.isBuffer(commit)) {
      this._commit = commit.toString('utf8')
    } else if (typeof commit === 'object') {
      this._commit = GitCommit.render(commit)
    } else {
      throw new GitError(E.InternalFail, {
        message: 'invalid type passed to GitCommit constructor'
      })
    }
  }

  static fromPayloadSignature ({ payload, signature }) {
    let headers = GitCommit.justHeaders(payload)
    let message = GitCommit.justMessage(payload)
    let commit = normalizeNewlines(
      headers + '\ngpgsig' + indent(signature) + '\n' + message
    )
    return new GitCommit(commit)
  }

  static from (commit) {
    return new GitCommit(commit)
  }

  toObject () {
    return Buffer.from(this._commit, 'utf8')
  }

  // Todo: allow setting the headers and message
  headers () {
    return this.parseHeaders()
  }

  // Todo: allow setting the headers and message
  message () {
    return GitCommit.justMessage(this._commit)
  }

  parse () {
    return Object.assign({ message: this.message() }, this.headers())
  }

  static justMessage (commit) {
    return normalizeNewlines(commit.slice(commit.indexOf('\n\n') + 2))
  }

  static justHeaders (commit) {
    return commit.slice(0, commit.indexOf('\n\n'))
  }

  parseHeaders () {
    let headers = GitCommit.justHeaders(this._commit).split('\n')
    let hs = []
    for (let h of headers) {
      if (h[0] === ' ') {
        // combine with previous header (without space indent)
        hs[hs.length - 1] += '\n' + h.slice(1)
      } else {
        hs.push(h)
      }
    }
    let obj = {
      parent: []
    }
    for (let h of hs) {
      let key = h.slice(0, h.indexOf(' '))
      let value = h.slice(h.indexOf(' ') + 1)
      if (Array.isArray(obj[key])) {
        obj[key].push(value)
      } else {
        obj[key] = value
      }
    }
    if (obj.author) {
      obj.author = parseAuthor(obj.author)
    }
    if (obj.committer) {
      obj.committer = parseAuthor(obj.committer)
    }
    return obj
  }

  static renderHeaders (obj) {
    let headers = ''
    if (obj.tree) {
      headers += `tree ${obj.tree}\n`
    } else {
      headers += `tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n` // the null tree
    }
    if (obj.parent) {
      if (obj.parent.length === undefined) {
        throw new GitError(E.InternalFail, {
          message: `commit 'parent' property should be an array`
        })
      }
      for (let p of obj.parent) {
        headers += `parent ${p}\n`
      }
    }
    let author = obj.author
    headers += `author ${formatAuthor(author)}\n`
    let committer = obj.committer || obj.author
    headers += `committer ${formatAuthor(committer)}\n`
    if (obj.gpgsig) {
      headers += 'gpgsig' + indent(obj.gpgsig)
    }
    return headers
  }

  static render (obj) {
    return GitCommit.renderHeaders(obj) + '\n' + normalizeNewlines(obj.message)
  }

  render () {
    return this._commit
  }

  withoutSignature () {
    let commit = normalizeNewlines(this._commit)
    if (commit.indexOf('\ngpgsig') === -1) return commit
    let headers = commit.slice(0, commit.indexOf('\ngpgsig'))
    let message = commit.slice(
      commit.indexOf('-----END PGP SIGNATURE-----\n') +
        '-----END PGP SIGNATURE-----\n'.length
    )
    return normalizeNewlines(headers + '\n' + message)
  }

  isolateSignature () {
    let signature = this._commit.slice(
      this._commit.indexOf('-----BEGIN PGP SIGNATURE-----'),
      this._commit.indexOf('-----END PGP SIGNATURE-----') +
        '-----END PGP SIGNATURE-----'.length
    )
    return outdent(signature)
  }
}
