import { BaseError } from './BaseError.js'

export class MissingParameterError extends BaseError {
  /**
   * @param {string} parameter
   */
  constructor(parameter) {
    super(
      `The function requires a "${parameter}" parameter but none was provided.`
    )
    this.code = this.name = MissingParameterError.code
    this.data = { parameter }
  }
}
/** @type {'MissingParameterError'} */
MissingParameterError.code = 'MissingParameterError'
