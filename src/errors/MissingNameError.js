import { BaseError } from './BaseError.js'

export class MissingNameError extends BaseError {
  /**
   * @param {'author'|'committer'|'tagger'} role
   */
  constructor(role) {
    super(
      `No name was provided for ${role} in the argument or in the .git/config file.`
    )
    this.code = this.name = MissingNameError.code
    this.data = { role }
  }
}
/** @type {'MissingNameError'} */
MissingNameError.code = 'MissingNameError'
