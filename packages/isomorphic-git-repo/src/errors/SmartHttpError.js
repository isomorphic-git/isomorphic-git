import { BaseError } from './BaseError.js'

export class SmartHttpError extends BaseError {
  /**
   * @param {string} preview
   * @param {string} response
   */
  constructor(preview, response) {
    super(
      `Remote did not reply using the "smart" HTTP protocol. Expected "001e# service=git-upload-pack" but received: ${preview}`
    )
    this.code = this.name = SmartHttpError.code
    this.data = { preview, response }
  }
}
/** @type {'SmartHttpError'} */
SmartHttpError.code = 'SmartHttpError'
