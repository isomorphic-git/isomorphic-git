import { BaseError } from './BaseError.js'

export class UnrelatedHistoriesError extends BaseError {
  /**
   * @param {string} ours
   * @param {string} theirs
   * @param {boolean} shallow - true when the walk stopped at a commit whose parents a shallow clone cut off, so the common ancestor may simply not have been fetched
   */
  constructor(ours, theirs, shallow) {
    super(
      `Refusing to merge unrelated histories: ${ours} and ${theirs} have no common ancestor.${
        shallow
          ? ' This is a shallow clone, so the common ancestor may not have been fetched yet.'
          : ''
      } To merge them anyway, call merge with allowUnrelatedHistories: true.`
    )
    this.code = this.name = UnrelatedHistoriesError.code
    this.data = { ours, theirs, shallow }
  }
}
/** @type {'UnrelatedHistoriesError'} */
UnrelatedHistoriesError.code = 'UnrelatedHistoriesError'
