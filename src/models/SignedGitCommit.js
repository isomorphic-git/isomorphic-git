import { GitSigningManager } from '../managers'

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
  async sign (privateKeys /*: string */) {
    let commit = this.withoutSignature()
    let headers = GitCommit.justHeaders(this._commit)
    let message = GitCommit.justMessage(this._commit)
    let signature = await GitSigningManager.getSigningHelper().sign({
      payload: commit,
      secretKey: privateKeys
    })
    // renormalize the line endings to the one true line-ending
    signature = normalize(signature)
    let signedCommit =
      headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message
    // return a new commit object
    return GitCommit.from(signedCommit)
  }

  async verify (publicKeys /*: string */) {
    return GitSigningManager.getSigningHelper().verify({
      payload: this.withoutSignature(),
      signature: this.isolateSignature(),
      publicKey: publicKeys
    })
  }
}
