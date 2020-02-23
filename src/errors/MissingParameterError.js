import { BaseError } from './BaseError.js'

export class MissingParameterError extends BaseError {
  /**
   * @param {string} parameter
   */
  constructor(parameter) {
    super(
      `The function requires a "${parameter}" parameter but none was provided.`
    )
    /** @type {'MissingParameterError'} */
    this.code = this.name = 'MissingParameterError'
    this.data = { parameter }
  }
}
/** @type {'MissingParameterError'} */
MissingParameterError.code = 'MissingParameterError'
