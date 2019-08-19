import { indent } from '../utils/indent.js'
import { normalizeNewlines } from '../utils/normalizeNewlines.js'

import { GitCommit } from './GitCommit'

export class SignedGitCommit extends GitCommit {
  static from (commit) {
    return new SignedGitCommit(commit)
  }

  async sign (openpgp, privateKeys) {
    const commit = this.withoutSignature()
    const headers = GitCommit.justHeaders(this._commit)
    const message = GitCommit.justMessage(this._commit)
    const privKeyObj = openpgp.key.readArmored(privateKeys).keys
    let { signature } = await openpgp.sign({
      data: openpgp.util.str2Uint8Array(commit),
      privateKeys: privKeyObj,
      detached: true,
      armor: true
    })
    // renormalize the line endings to the one true line-ending
    signature = normalizeNewlines(signature)
    const signedCommit =
      headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message
    // return a new commit object
    return GitCommit.from(signedCommit)
  }

  async listSigningKeys (openpgp) {
    const msg = openpgp.message.readSignedContent(
      this.withoutSignature(),
      this.isolateSignature()
    )
    return msg.getSigningKeyIds().map(keyid => keyid.toHex())
  }

  async verify (openpgp, publicKeys) {
    const pubKeyObj = openpgp.key.readArmored(publicKeys).keys
    const msg = openpgp.message.readSignedContent(
      this.withoutSignature(),
      this.isolateSignature()
    )
    const results = msg.verify(pubKeyObj)
    const validity = results.reduce((a, b) => a.valid && b.valid, {
      valid: true
    })
    return validity
  }
}
