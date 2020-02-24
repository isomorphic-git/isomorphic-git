import { BaseError } from './BaseError.js'

export class ParseError extends BaseError {
  /**
   * @param {string} expected
   * @param {string} actual
   */
  constructor(expected, actual) {
    super(`Expected "${expected}" but received "${actual}".`)
    this.code = this.name = ParseError.code
    this.data = { expected, actual }
  }
}
/** @type {'ParseError'} */
ParseError.code = 'ParseError'
