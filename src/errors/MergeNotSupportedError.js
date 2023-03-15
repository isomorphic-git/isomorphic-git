import { BaseError } from './BaseError.js'

export class MergeNotSupportedError extends BaseError {
  constructor() {
    super(`Merges with conflicts are not supported yet.`)
    this.code = this.name = MergeNotSupportedError.code
    this.data = {}
  }
}
/** @type {'MergeNotSupportedError'} */
MergeNotSupportedError.code = 'MergeNotSupportedError'
