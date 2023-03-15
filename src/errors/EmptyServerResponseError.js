import { BaseError } from './BaseError.js'

export class EmptyServerResponseError extends BaseError {
  constructor() {
    super(`Empty response from git server.`)
    this.code = this.name = EmptyServerResponseError.code
    this.data = {}
  }
}
/** @type {'EmptyServerResponseError'} */
EmptyServerResponseError.code = 'EmptyServerResponseError'
