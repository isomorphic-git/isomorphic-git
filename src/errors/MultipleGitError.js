import { BaseError } from './BaseError.js'

export class MultipleGitError extends BaseError {
  /**
   * @param {Error[]} errors
   * @param {string} message
   */
  constructor(errors) {
    super(
      `There are multiple errors that were thrown by the method. Please refer to the "errors" property to see more`
    )
    this.code = this.name = MultipleGitError.code
    this.data = { errors }
    this.errors = errors
  }
}
/** @type {'MultipleGitError'} */
MultipleGitError.code = 'MultipleGitError'
