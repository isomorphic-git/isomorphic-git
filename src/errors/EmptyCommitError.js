import { BaseError } from './BaseError.js'

export class EmptyCommitError extends BaseError {
  constructor() {
    super('Cannot create an empty commit when disallowEmpty is true.')
    this.code = this.name = EmptyCommitError.code
    this.data = {}
  }
}
/** @type {'EmptyCommitError'} */
EmptyCommitError.code = 'EmptyCommitError'
