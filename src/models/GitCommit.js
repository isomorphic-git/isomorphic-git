import { InternalError } from '../errors/InternalError.js'
import { ParseError } from '../errors/ParseError.js'
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
    const keyOf = h => h.slice(0, h.indexOf(' '))
    const valueOf = h => h.slice(h.indexOf(' ') + 1)
    // Git reads the start of a commit by position: one `tree`, then the
    // `parent` lines that follow it directly. Anything after that run is an
    // extra header that git keeps but never interprets, so a `tree` or
    // `parent` further down must not count here either. Reading them would
    // give the same oid a different tree, or a different ancestry, than git
    // and every other implementation reports.
    if (hs.length === 0 || keyOf(hs[0]) !== 'tree') {
      throw new ParseError(
        'tree as the first commit header',
        keyOf(hs[0] || '')
      )
    }
    obj.tree = valueOf(hs[0])
    let index = 1
    while (index < hs.length && keyOf(hs[index]) === 'parent') {
      obj.parent.push(valueOf(hs[index]))
      index++
    }
    const seen = new Set(['tree', 'parent'])
    for (; index < hs.length; index++) {
      const key = keyOf(hs[index])
      // The first occurrence of a single-valued header wins, the way canonical
      // git reads them.
      if (seen.has(key)) continue
      seen.add(key)
      obj[key] = valueOf(hs[index])
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

  /** Return the signature verification payload, preserving blank message lines. */
  withoutSignature() {
    const commit = normalizeNewlines(this._commit)
    let inSignature = false
    const headers = GitCommit.justHeaders(commit)
      .split('\n')
      .filter(line => {
        if (!line.startsWith(' ')) inSignature = line.startsWith('gpgsig ')
        return !inSignature
      })
      .join('\n')
    return headers + '\n\n' + commit.slice(commit.indexOf('\n\n') + 2)
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
