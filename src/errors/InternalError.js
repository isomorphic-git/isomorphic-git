import { BaseError } from './BaseError.js'

export class InternalError extends BaseError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(
      `An internal error caused this command to fail.\n\nIf you're not a developer, report the bug to the developers of the application you're using. If this is a bug in isomorphic-git then you should create a proper bug yourselves. The bug should include a minimal reproduction and details about the version and environment.\n\nPlease file a bug report at https://github.com/isomorphic-git/isomorphic-git/issues with this error message: ${message}`
    )
    this.code = this.name = InternalError.code
    this.data = { message }
  }
}
/** @type {'InternalError'} */
InternalError.code = 'InternalError'
