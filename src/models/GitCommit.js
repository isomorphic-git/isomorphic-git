// @flow
'use strict'
import { Buffer } from 'buffer'
import * as openpgp from 'openpgp'

function formatTimezoneOffset (minutes /*: number */) {
  let sign = Math.sign(minutes) || 1
  minutes = Math.abs(minutes)
  let hours = Math.floor(minutes / 60)
  minutes -= hours * 60
  let strHours = String(hours)
  let strMinutes = String(minutes)
  if (strHours.length < 2) strHours = '0' + strHours
  if (strMinutes.length < 2) strMinutes = '0' + strMinutes
  return (sign === -1 ? '+' : '-') + strHours + strMinutes
}

function parseTimezoneOffset (offset) {
  let [, sign, hours, minutes] = offset.match(/(\+|-)(\d\d)(\d\d)/)
  minutes = (sign === '-' ? 1 : -1) * Number(hours) * 60 + Number(minutes)
  return minutes
}

function parseAuthor (author) {
  let [, name, email, timestamp, offset] = author.match(
    /^(.*) <(.*)> (.*) (.*)$/
  )
  return {
    name: name,
    email: email,
    timestamp: Number(timestamp),
    timezoneOffset: parseTimezoneOffset(offset)
  }
}

function normalize (str) {
  // remove all <CR>
  str = str.replace(/\r/g, '')
  // no extra newlines up front
  str = str.replace(/^\n+/, '')
  // and a single newline at the end
  str = str.replace(/\n+$/, '') + '\n'
  return str
}

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

// TODO: Make all functions have static async signature?

export default class GitCommit {
  /*::
  _commit : string
  */
  constructor (commit /*: string|Buffer */) {
    if (typeof commit === 'string') {
      this._commit = commit
    } else if (Buffer.isBuffer(commit)) {
      this._commit = commit.toString('utf8')
    } else if (typeof commit === 'object') {
      this._commit = GitCommit.render(commit)
    } else {
      throw new Error('invalid type passed to GitCommit constructor')
    }
  }

  static fromPayloadSignature ({ payload, signature }) {
    let headers = GitCommit.justHeaders(payload)
    let message = GitCommit.justMessage(payload)
    let commit = normalize(
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

  static justMessage (commit) {
    return commit.slice(commit.indexOf('\n\n') + 2)
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
    let obj = {}
    for (let h of hs) {
      let key = h.slice(0, h.indexOf(' '))
      let value = h.slice(h.indexOf(' ') + 1)
      obj[key] = value
    }
    obj.parent = obj.parent ? obj.parent.split(' ') : []
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
      headers += 'parent'
      for (let p of obj.parent) {
        headers += ' ' + p
      }
      headers += '\n'
    }
    let author = obj.author
    headers += `author ${author.name} <${author.email}> ${author.timestamp} ${formatTimezoneOffset(
      author.timezoneOffset
    )}\n`
    let committer = obj.committer || obj.author
    headers += `committer ${committer.name} <${committer.email}> ${committer.timestamp} ${formatTimezoneOffset(
      committer.timezoneOffset
    )}\n`
    if (obj.gpgsig) {
      headers += 'gpgsig' + indent(obj.gpgsig)
    }
    return headers
  }

  static render (obj) {
    return GitCommit.renderHeaders(obj) + '\n' + obj.message
  }

  render () {
    return this._commit
  }

  withoutSignature () {
    let commit = normalize(this._commit)
    if (commit.indexOf('\ngpgsig') === -1) return commit
    let headers = commit.slice(0, commit.indexOf('\ngpgsig'))
    let message = commit.slice(
      commit.indexOf('-----END PGP SIGNATURE-----\n') +
        '-----END PGP SIGNATURE-----\n'.length
    )
    return normalize(headers + '\n' + message)
  }

  isolateSignature () {
    let signature = this._commit.slice(
      this._commit.indexOf('-----BEGIN PGP SIGNATURE-----'),
      this._commit.indexOf('-----END PGP SIGNATURE-----') +
        '-----END PGP SIGNATURE-----'.length
    )
    return outdent(signature)
  }
  // Temporarily disabled
  
  /*
  // Verify `message` with detached `signature` using the public key for `email`
  static async verifyDetachedSignature (email, message, signature) {
    locallookup(email)
    console.log('email, message, signature =', email, message, signature)
    let msg = openpgp.message.readSignedContent(message, signature)
    console.log('msg =', msg)
    var result = msg.verify(keyring.publicKeys.keys)
    console.log('result[0] =', result[0])
    console.log('keyid =', printKeyid(result[0].keyid))
    return result[0].valid
  }
*/
/*
  // Sign `plaintext` using the private key for `email'
  static async createBinaryDetachedSignature (email, plaintext) {
    // Load keypair from localstorage
    let privateKey = PGP.lookupPrivateKey(email)
    if (privateKey) {
      // Is the only difference between cleartext signatures and detached binary the text normalization?
      // If so, I could probably add that functionality to openpgpjs - I'd just need a little guidance
      // on how to encode the PacketType and add the functionality to export to armor.js
      let bytes = openpgp.util.str2Uint8Array(plaintext)
      let message = openpgp.message.fromBinary(bytes)
      let signedMessage = message.sign([privateKey])
      let signature = signedMessage.packets.filterByTag(
        openpgp.enums.packet.signature
      )
      let armoredMessage = openpgp.armor.encode(
        openpgp.enums.armor.message,
        signature.write()
      )
      // Github won't recognize the signature unless we rename the headers (Tested 2017-01-04)
      armoredMessage = armoredMessage.replace(
        '-----BEGIN PGP MESSAGE-----\r\n',
        '-----BEGIN PGP SIGNATURE-----\r\n'
      )
      armoredMessage = armoredMessage.replace(
        '-----END PGP MESSAGE-----\r\n',
        '-----END PGP SIGNATURE-----\r\n'
      )
      return armoredMessage
    } else {
      throw new Error(
        'No PrivateKey in the OpenPGP keyring for the email address: ' + email
      )
    }
  }
  */

  async addSignature (privateKey /*: string */) {
    let commit = this.withoutSignature()
    let headers = GitCommit.justHeaders(this._commit)
    let message = GitCommit.justMessage(this._commit)
    let header = this.parseHeaders()
    let privKeyObj = openpgp.key.readArmored(privateKey).keys
    let {signature} = await openpgp.sign({
      data: commit,
      privateKeys: privKeyObj,
      detached: true,
      armor: true
    })
    
    //let signedmsg = await pgp.createBinaryDetachedSignature(
    //  header.committer.email,
    //  commit
    //)
    
    // renormalize the line endings to the one true line-ending
    signature = normalize(signature)
    let signedCommit =
      headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message
    console.log(signedCommit)
    // return a new commit object
    return GitCommit.from(signedCommit)
  }
  
  async verifySignature (publicKeys /*: Array<string> */) {
    // let header = this.parseHeaders()
    let pubKeyObj = openpgp.key.readArmored(publicKeys).keys
    let verified = await openpgp.verify({
      publicKeys: pubKeyObj,
      message: this.withoutSignature(),
      signature: this.isolateSignature
    })
    /*
    let verified = await pgp.verifyDetachedSignature(
      header.committer.email,
      this.withoutSignature(),
      this.isolateSignature()
    )
    */
    console.log(verified)
    return verified
  }
}
