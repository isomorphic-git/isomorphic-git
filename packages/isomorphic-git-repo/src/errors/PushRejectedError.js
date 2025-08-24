import { BaseError } from './BaseError.js'

export class PushRejectedError extends BaseError {
  /**
   * @param {'not-fast-forward'|'tag-exists'} reason
   */
  constructor(reason) {
    let message = ''
    if (reason === 'not-fast-forward') {
      message = ' because it was not a simple fast-forward'
    } else if (reason === 'tag-exists') {
      message = ' because tag already exists'
    }
    super(`Push rejected${message}. Use "force: true" to override.`)
    this.code = this.name = PushRejectedError.code
    this.data = { reason }
  }
}
/** @type {'PushRejectedError'} */
PushRejectedError.code = 'PushRejectedError'
