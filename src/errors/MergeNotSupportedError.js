import { BaseError } from './BaseError.js'

export class MergeNotSupportedError extends BaseError {
  constructor(message = `Merges with conflicts are not supported yet.`) {
    super(message)
    this.code = this.name = MergeNotSupportedError.code
    this.data = {}
  }
}
/** @type {'MergeNotSupportedError'} */
MergeNotSupportedError.code = 'MergeNotSupportedError'
