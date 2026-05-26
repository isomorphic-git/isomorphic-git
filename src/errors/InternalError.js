import { BaseError } from './BaseError.js'

export class InternalError extends BaseError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(
      `An internal error caused this command to fail.\n\nIf you're using an application that depends on isomorphic-git, please report this error to that application's developers.\n\nIf you're a developer and you believe this is a bug in isomorphic-git, please file an issue at https://github.com/isomorphic-git/isomorphic-git/issues with a minimal reproduction, version and environment details, and this error message: ${message}`
    )
    this.code = this.name = InternalError.code
    this.data = { message }
  }
}
/** @type {'InternalError'} */
InternalError.code = 'InternalError'
