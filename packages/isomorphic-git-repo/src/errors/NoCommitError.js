import { BaseError } from './BaseError.js'

export class NoCommitError extends BaseError {
  /**
   * @param {string} ref
   */
  constructor(ref) {
    super(
      `"${ref}" does not point to any commit. You're maybe working on a repository with no commits yet. `
    )
    this.code = this.name = NoCommitError.code
    this.data = { ref }
  }
}
/** @type {'NoCommitError'} */
NoCommitError.code = 'NoCommitError'
