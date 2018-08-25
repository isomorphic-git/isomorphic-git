import { E, GitError } from '../models/GitError.js'
import { formatAuthor } from '../utils/formatAuthor.js'
import { normalizeNewlines } from '../utils/normalizeNewlines.js'
import { parseAuthor } from '../utils/parseAuthor.js'

export class GitAnnotatedTag {
  constructor (tag) {
    if (typeof tag === 'string') {
      this._tag = tag
    } else if (Buffer.isBuffer(tag)) {
      this._tag = tag.toString('utf8')
    } else if (typeof tag === 'object') {
      this._tag = GitAnnotatedTag.render(tag)
    } else {
      throw new GitError(E.InternalFail, {
        message: 'invalid type passed to GitAnnotatedTag constructor'
      })
    }
  }

  static from (tag) {
    return new GitAnnotatedTag(tag)
  }

  static render (obj) {
    return `object ${obj.object}
type ${obj.type}
tag ${obj.tag}
tagger ${formatAuthor(obj.tagger)}

${obj.message}
${obj.signature}`
  }

  justHeaders () {
    return this._tag.slice(0, this._tag.indexOf('\n\n'))
  }

  message () {
    let tag = this.withoutSignature()
    return tag.slice(tag.indexOf('\n\n') + 2)
  }

  parse () {
    return Object.assign(this.headers(), {
      message: this.message(),
      signature: this.signature()
    })
  }

  render () {
    return this._tag
  }

  headers () {
    let headers = this.justHeaders().split('\n')
    let hs = []
    for (let h of headers) {
      if (h[0] === ' ') {
        // combine with previous header (without space indent)
        hs[hs.length - 1] += '\n' + h.slice(1)
      } else {
        hs.push(h)
      }
    }
    let obj = {}
    for (let h of hs) {
      let key = h.slice(0, h.indexOf(' '))
      let value = h.slice(h.indexOf(' ') + 1)
      if (Array.isArray(obj[key])) {
        obj[key].push(value)
      } else {
        obj[key] = value
      }
    }
    if (obj.tagger) {
      obj.tagger = parseAuthor(obj.tagger)
    }
    if (obj.committer) {
      obj.committer = parseAuthor(obj.committer)
    }
    return obj
  }

  withoutSignature () {
    let tag = normalizeNewlines(this._tag)
    if (tag.indexOf('\n-----BEGIN PGP SIGNATURE-----') === -1) return tag
    return tag.slice(0, tag.lastIndexOf('\n-----BEGIN PGP SIGNATURE-----'))
  }

  signature () {
    let signature = this._tag.slice(
      this._tag.indexOf('-----BEGIN PGP SIGNATURE-----'),
      this._tag.indexOf('-----END PGP SIGNATURE-----') +
        '-----END PGP SIGNATURE-----'.length
    )
    return normalizeNewlines(signature)
  }

  toObject () {
    return Buffer.from(this._tag, 'utf8')
  }
}
