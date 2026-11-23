import { BaseError } from './BaseError.js'

export class MergeNotSupportedError extends BaseError {
  /**
   * @param {string} [what='conflicts'] - the kind of merge that is not supported
   */
  constructor(what = 'conflicts') {
    super(`Merges with ${what} are not supported yet.`)
    this.code = this.name = MergeNotSupportedError.code
    this.data = { what }
  }
}
/** @type {'MergeNotSupportedError'} */
MergeNotSupportedError.code = 'MergeNotSupportedError'
