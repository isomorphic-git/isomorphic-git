import { GitCommit } from './GitCommit'

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

export class SignedGitCommit extends GitCommit {
  static from (commit) {
    return new SignedGitCommit(commit)
  }
  async sign (openpgp, privateKeys) {
    let commit = this.withoutSignature()
    let headers = GitCommit.justHeaders(this._commit)
    let message = GitCommit.justMessage(this._commit)
    let privKeyObj = openpgp.key.readArmored(privateKeys).keys
    let { signature } = await openpgp.sign({
      data: openpgp.util.str2Uint8Array(commit),
      privateKeys: privKeyObj,
      detached: true,
      armor: true
    })
    // renormalize the line endings to the one true line-ending
    signature = normalize(signature)
    let signedCommit =
      headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message
    // return a new commit object
    return GitCommit.from(signedCommit)
  }

  async listSigningKeys (openpgp) {
    let msg = openpgp.message.readSignedContent(
      this.withoutSignature(),
      this.isolateSignature()
    )
    return msg.getSigningKeyIds().map(keyid => keyid.toHex())
  }

  async verify (openpgp, publicKeys) {
    let pubKeyObj = openpgp.key.readArmored(publicKeys).keys
    let msg = openpgp.message.readSignedContent(
      this.withoutSignature(),
      this.isolateSignature()
    )
    let results = msg.verify(pubKeyObj)
    let validity = results.reduce((a, b) => a.valid && b.valid, { valid: true })
    return validity
  }
}
