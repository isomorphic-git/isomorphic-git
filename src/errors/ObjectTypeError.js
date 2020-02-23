import { BaseError } from './BaseError.js'

export class ObjectTypeError extends BaseError {
  /**
   * @param {string} oid
   * @param {string} actual
   * @param {string} expected
   */
  constructor(oid, actual, expected) {
    super(
      `Object ${oid} was anticipated to be a ${expected} but it is a ${actual}.`
    )
    this.code = this.name = ObjectTypeError.code
    this.data = { oid, actual, expected }
  }
}
/** @type {'ObjectTypeError'} */
ObjectTypeError.code = 'ObjectTypeError'
