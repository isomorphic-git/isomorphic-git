import { BaseError } from './BaseError.js'

export class CherryPickMergeCommitError extends BaseError {
  /**
   * @param {string} oid
   * @param {number} parentCount
   */
  constructor(oid, parentCount) {
    super(
      `Cannot cherry-pick merge commit ${oid}. ` +
        `Merge commits have ${parentCount} parents and require specifying which parent to use as the base.`
    )
    this.code = this.name = CherryPickMergeCommitError.code
    this.data = { oid, parentCount }
  }
}
/** @type {'CherryPickMergeCommitError'} */
CherryPickMergeCommitError.code = 'CherryPickMergeCommitError'
