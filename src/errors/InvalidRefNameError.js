import { BaseError } from './BaseError.js'

export class InvalidRefNameError extends BaseError {
  /**
   * @param {string} ref
   * @param {string} suggestion
   * @param {boolean} canForce
   */
  constructor(ref, suggestion) {
    super(
      `"${ref}" would be an invalid git reference. (Hint: a valid alternative would be "${suggestion}".)`
    )
    this.code = this.name = InvalidRefNameError.code
    this.data = { ref, suggestion }
  }
}
/** @type {'InvalidRefNameError'} */
InvalidRefNameError.code = 'InvalidRefNameError'
