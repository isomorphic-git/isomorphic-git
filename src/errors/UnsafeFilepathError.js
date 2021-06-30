import { BaseError } from './BaseError.js'

export class UnsafeFilepathError extends BaseError {
  /**
   * @param {string} filepath
   */
  constructor(filepath) {
    super(`The filepath "${filepath}" contains unsafe character sequences`)
    this.code = this.name = UnsafeFilepathError.code
    this.data = { filepath }
  }
}
/** @type {'UnsafeFilepathError'} */
UnsafeFilepathError.code = 'UnsafeFilepathError'
