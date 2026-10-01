import { BaseError } from './BaseError.js'

export class CherryPickLocalChangesError extends BaseError {
  /**
   * @param {string[]} filepaths
   */
  constructor(filepaths) {
    super(
      `Your local changes to the following files would be overwritten by cherry-pick: ${filepaths.join(
        ', '
      )}`
    )
    this.code = this.name = CherryPickLocalChangesError.code
    this.data = { filepaths }
  }
}
/** @type {'CherryPickLocalChangesError'} */
CherryPickLocalChangesError.code = 'CherryPickLocalChangesError'
