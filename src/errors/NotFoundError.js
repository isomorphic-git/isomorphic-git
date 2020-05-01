import { BaseError } from 'BaseError'

export class NotFoundError extends BaseError {
  /**
   * @param {string} what
   */
  constructor(what) {
    super(`Could not find ${what}.`)
    this.code = this.name = NotFoundError.code
    this.data = { what }
  }
}
/** @type {'NotFoundError'} */
NotFoundError.code = 'NotFoundError'
