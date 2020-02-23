import { BaseError } from './BaseError.js'

export class HttpError extends BaseError {
  /**
   * @param {number} statusCode
   * @param {string} statusMessage
   */
  constructor(statusCode, statusMessage) {
    super(`HTTP Error: ${statusCode} ${statusMessage}`)
    this.code = this.name = HttpError.code
    this.data = { statusCode, statusMessage }
  }
}
/** @type {'HttpError'} */
HttpError.code = 'HttpError'
