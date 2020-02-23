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
    /** @type {'CheckoutConflictError'} */
    this.code = this.name = 'CheckoutConflictError'
    this.data = { filepaths }
  }
}
