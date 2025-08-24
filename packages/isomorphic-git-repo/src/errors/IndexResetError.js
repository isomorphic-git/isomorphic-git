import { BaseError } from './BaseError.js'

export class IndexResetError extends BaseError {
  /**
   * @param {Array<string>} filepaths
   */
  constructor(filepath) {
    super(
      `Could not merge index: Entry for '${filepath}' is not up to date. Either reset the index entry to HEAD, or stage your unstaged changes.`
    )
    this.code = this.name = IndexResetError.code
    this.data = { filepath }
  }
}
/** @type {'IndexResetError'} */
IndexResetError.code = 'IndexResetError'
