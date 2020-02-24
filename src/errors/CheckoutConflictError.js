import { BaseError } from './BaseError.js'

export class CheckoutConflictError extends BaseError {
  /**
   * @param {string[]} filepaths
   */
  constructor(filepaths) {
    super(
      `Your local changes to the following files would be overwritten by checkout: ${filepaths.join(
        ', '
      )}`
    )
    this.code = this.name = CheckoutConflictError.code
    this.data = { filepaths }
  }
}
/** @type {'CheckoutConflictError'} */
CheckoutConflictError.code = 'CheckoutConflictError'
