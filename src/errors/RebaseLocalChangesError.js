import { BaseError } from './BaseError.js'

export class RebaseLocalChangesError extends BaseError {
  /**
   * @param {string[]} filepaths
   */
  constructor(filepaths) {
    super(
      `Cannot rebase: you have local changes to the following files: ${filepaths.join(
        ', '
      )}. Commit or stash them first.`
    )
    this.code = this.name = RebaseLocalChangesError.code
    this.data = { filepaths }
  }
}
/** @type {'RebaseLocalChangesError'} */
RebaseLocalChangesError.code = 'RebaseLocalChangesError'
