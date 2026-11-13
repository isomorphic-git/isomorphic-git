import { BaseError } from './BaseError.js'

export class MergeLocalChangesError extends BaseError {
  /**
   * @param {string[]} filepaths
   */
  constructor(filepaths) {
    super(
      `Your local changes to the following files would be overwritten by merge: ${filepaths.join(
        ', '
      )}`
    )
    this.code = this.name = MergeLocalChangesError.code
    this.data = { filepaths }
  }
}
/** @type {'MergeLocalChangesError'} */
MergeLocalChangesError.code = 'MergeLocalChangesError'
