import { BaseError } from './BaseError.js'

export class PushRejectedError extends BaseError {
  /**
   * @param {string} reason
   */
  constructor(reason) {
    super(`Push rejected because ${reason}. Use "force: true" to override.`)
    this.code = this.name = PushRejectedError.code
    this.data = { reason }
  }
}
/** @type {'PushRejectedError'} */
PushRejectedError.code = 'PushRejectedError'
