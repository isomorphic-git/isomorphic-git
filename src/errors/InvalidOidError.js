import { BaseError } from './BaseError.js'

export class InvalidOidError extends BaseError {
  /**
   * @param {string} value
   */
  constructor(value) {
    super(`Expected a 40-char hex object id but saw "${value}".`)
    this.code = this.name = InvalidOidError.code
    this.data = { value }
  }
}
/** @type {'InvalidOidError'} */
InvalidOidError.code = 'InvalidOidError'
