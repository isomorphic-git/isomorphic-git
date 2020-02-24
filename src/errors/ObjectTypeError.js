import { BaseError } from './BaseError.js'

export class ObjectTypeError extends BaseError {
  /**
   * @param {string} oid
   * @param {string} actual
   * @param {string} expected
   * @param {string} [filepath]
   */
  constructor(oid, actual, expected, filepath) {
    super(
      `Object ${oid} ${
        filepath ? `at ${filepath}` : ''
      }was anticipated to be a ${expected} but it is a ${actual}.`
    )
    this.code = this.name = ObjectTypeError.code
    this.data = { oid, actual, expected, filepath }
  }
}
/** @type {'ObjectTypeError'} */
ObjectTypeError.code = 'ObjectTypeError'
