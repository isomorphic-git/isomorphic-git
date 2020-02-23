import { BaseError } from './BaseError.js'

export class FileReadError extends BaseError {
  /**
   * @param {string} filepath
   */
  constructor(filepath) {
    super(`Could not read file "${filepath}".`)
    /** @type {'FileReadError'} */
    this.code = this.name = 'FileReadError'
    this.data = { filepath }
  }
}
/** @type {'FileReadError'} */
FileReadError.code = FileReadError
