import { BaseError } from './BaseError.js'

export class AbortError extends BaseError {
  constructor() {
    super(`The operation was aborted.`)
    this.code = this.name = AbortError.code
    this.data = {}
  }
}
/** @type {'AbortError'} */
AbortError.code = 'AbortError'
