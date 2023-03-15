import { BaseError } from './BaseError.js'

export class AlreadyExistsError extends BaseError {
  /**
   * @param {'note'|'remote'|'tag'|'branch'} noun
   * @param {string} where
   * @param {boolean} canForce
   */
  constructor(noun, where, canForce = true) {
    super(
      `Failed to create ${noun} at ${where} because it already exists.${
        canForce
          ? ` (Hint: use 'force: true' parameter to overwrite existing ${noun}.)`
          : ''
      }`
    )
    this.code = this.name = AlreadyExistsError.code
    this.data = { noun, where, canForce }
  }
}
/** @type {'AlreadyExistsError'} */
AlreadyExistsError.code = 'AlreadyExistsError'
