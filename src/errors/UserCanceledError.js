import { BaseError } from './BaseError.js'

export class UserCanceledError extends BaseError {
  constructor() {
    super(`The operation was canceled.`)
    /** @type {'UserCanceledError'} */
    this.code = this.name = 'UserCanceledError'
    this.data = {}
  }
}
