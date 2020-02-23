import { BaseError } from './BaseError.js'

export class InternalError extends BaseError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(
      `An internal error caused this command to fail. Please file a bug report at https://github.com/isomorphic-git/isomorphic-git/issues with this error message: ${message}`
    )
    this.code = this.name = InternalError.code
    this.data = { message }
  }
}
/** @type {'InternalError'} */
InternalError.code = 'InternalError'
