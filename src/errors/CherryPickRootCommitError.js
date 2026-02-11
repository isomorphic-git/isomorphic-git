import { BaseError } from './BaseError.js'

export class CherryPickRootCommitError extends BaseError {
  /**
   * @param {string} oid
   */
  constructor(oid) {
    super(
      `Cannot cherry-pick root commit ${oid}. Root commits have no parents.`
    )
    this.code = this.name = CherryPickRootCommitError.code
    this.data = { oid }
  }
}
/** @type {'CherryPickRootCommitError'} */
CherryPickRootCommitError.code = 'CherryPickRootCommitError'
