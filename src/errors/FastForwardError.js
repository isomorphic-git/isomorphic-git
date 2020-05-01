import { BaseError } from 'BaseError'

export class FastForwardError extends BaseError {
  constructor() {
    super(`A simple fast-forward merge was not possible.`)
    this.code = this.name = FastForwardError.code
    this.data = {}
  }
}
/** @type {'FastForwardError'} */
FastForwardError.code = 'FastForwardError'
