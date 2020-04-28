import { BaseError } from './BaseError.js'

export class HttpError extends BaseError {
  /**
   * @param {number} statusCode
   * @param {string} statusMessage
   * @param {string} response
   */
  constructor(statusCode, statusMessage, response) {
    super(`HTTP Error: ${statusCode} ${statusMessage}`)
    this.code = this.name = HttpError.code
    this.data = { statusCode, statusMessage, response }
  }
}
/** @type {'HttpError'} */
HttpError.code = 'HttpError'
