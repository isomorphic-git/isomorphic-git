import { BaseError } from './BaseError.js'

export class MergeConflictError extends BaseError {
  /**
   * @param {Array<string>} filepaths
   * @param {Array<string>} bothModified
   * @param {Array<string>} deleteByUs
   * @param {Array<string>} deleteByTheirs
   */
  constructor(filepaths, bothModified, deleteByUs, deleteByTheirs) {
    super(
      `Automatic merge failed with one or more merge conflicts in the following files: ${filepaths.toString()}. Fix conflicts then commit the result.`
    )
    this.code = this.name = MergeConflictError.code
    this.data = { filepaths, bothModified, deleteByUs, deleteByTheirs }
  }
}
/** @type {'MergeConflictError'} */
MergeConflictError.code = 'MergeConflictError'
