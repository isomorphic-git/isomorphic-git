import { BaseError } from './BaseError.js'

export class DecompressionError extends BaseError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(`Invalid compressed buffer: ${message}`)
    this.code = this.name = DecompressionError.code
    this.data = { message }
  }
}
/** @type {'DecompressionError'} */
DecompressionError.code = 'DecompressionError'
