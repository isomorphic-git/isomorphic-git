import { InternalError } from '../errors/InternalError.js'
import { formatAuthor } from '../utils/formatAuthor.js'
import { indent } from '../utils/indent.js'
import { normalizeNewlines } from '../utils/normalizeNewlines.js'
import { outdent } from '../utils/outdent.js'
import { parseAuthor } from '../utils/parseAuthor.js'

export class GitCommit {
  constructor(commit) {
    if (typeof commit === 'string') {
      this._commit = commit
    } else if (Buffer.isBuffer(commit)) {
      this._commit = commit.toString('utf8')
    } else if (typeof commit === 'object') {
      this._commit = GitCommit.render(commit)
    } else {
      throw new InternalError('invalid type passed to GitCommit constructor')
    }
  }

  static fromPayloadSignature({ payload, signature }) {
    const headers = GitCommit.justHeaders(payload)
    const message = GitCommit.justMessage(payload)
    const commit = normalizeNewlines(
      headers + '\ngpgsig' + indent(signature) + '\n' + message
    )
    return new GitCommit(commit)
  }

  static from(commit) {
    return new GitCommit(commit)
  }

  toObject() {
    return Buffer.from(this._commit, 'utf8')
  }

  // Todo: allow setting the headers and message
  headers() {
    return this.parseHeaders()
  }

  // Todo: allow setting the headers and message
  message() {
    return GitCommit.justMessage(this._commit)
  }

  parse() {
    return Object.assign({ message: this.message() }, this.headers())
  }

  static justMessage(commit) {
    return normalizeNewlines(commit.slice(commit.indexOf('\n\n') + 2))
  }

  static justHeaders(commit) {
    return commit.slice(0, commit.indexOf('\n\n'))
  }

  parseHeaders() {
    const headers = GitCommit.justHeaders(this._commit).split('\n')
    const hs = []
    for (const h of headers) {
      if (h[0] === ' ') {
        // combine with previous header (without space indent)
        hs[hs.length - 1] += '\n' + h.slice(1)
      } else {
        hs.push(h)
      }
    }
    const obj = {
      parent: [],
    }
    for (const h of hs) {
      const key = h.slice(0, h.indexOf(' '))
      const value = h.slice(h.indexOf(' ') + 1)
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

  static renderHeaders(obj) {
    let headers = ''
    if (obj.tree) {
      headers += `tree ${obj.tree}\n`
    } else {
      headers += `tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n` // the null tree
    }
    if (obj.parent) {
      if (obj.parent.length === undefined) {
        throw new InternalError(`commit 'parent' property should be an array`)
      }
      for (const p of obj.parent) {
        headers += `parent ${p}\n`
      }
    }
    const author = obj.author
    headers += `author ${formatAuthor(author)}\n`
    const committer = obj.committer || obj.author
    headers += `committer ${formatAuthor(committer)}\n`
    if (obj.gpgsig) {
      headers += 'gpgsig' + indent(obj.gpgsig)
    }
    return headers
  }

  static render(obj) {
    return GitCommit.renderHeaders(obj) + '\n' + normalizeNewlines(obj.message)
  }

  render() {
    return this._commit
  }

  withoutSignature() {
    const commit = normalizeNewlines(this._commit)
    if (commit.indexOf('\ngpgsig') === -1) return commit
    const headers = commit.slice(0, commit.indexOf('\ngpgsig'))
    const message = commit.slice(
      commit.indexOf('-----END PGP SIGNATURE-----\n') +
        '-----END PGP SIGNATURE-----\n'.length
    )
    return normalizeNewlines(headers + '\n' + message)
  }

  isolateSignature() {
    const signature = this._commit.slice(
      this._commit.indexOf('-----BEGIN PGP SIGNATURE-----'),
      this._commit.indexOf('-----END PGP SIGNATURE-----') +
        '-----END PGP SIGNATURE-----'.length
    )
    return outdent(signature)
  }

  static async sign(commit, sign, secretKey) {
    const payload = commit.withoutSignature()
    const message = GitCommit.justMessage(commit._commit)
    let { signature } = await sign({ payload, secretKey })
    // renormalize the line endings to the one true line-ending
    signature = normalizeNewlines(signature)
    const headers = GitCommit.justHeaders(commit._commit)
    const signedCommit =
      headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message
    // return a new commit object
    return GitCommit.from(signedCommit)
  }
}
