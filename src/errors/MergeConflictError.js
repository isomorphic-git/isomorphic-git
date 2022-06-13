import { BaseError } from './BaseError.js'

export class MergeConflictError extends BaseError {
  /**
   * @param {Array<string>} filepaths
   */
  constructor(filepaths) {
    super(
      `Automatic merge failed with one or more merge conflicts in the following files: ${filepaths.toString()}. Fix conflicts then commit the result.`
    )
    this.code = this.name = MergeConflictError.code
    this.data = { filepaths }
  }
}
/** @type {'MergeConflictError'} */
MergeConflictError.code = 'MergeConflictError'
