import { BaseError } from './BaseError.js'

export class CommitNotFetchedError extends BaseError {
  /**
   * @param {string} ref
   * @param {string} oid
   */
  constructor(ref, oid) {
    super(
      `Failed to checkout "${ref}" because commit ${oid} is not available locally. Do a git fetch to make the branch available locally.`
    )
    this.code = this.name = CommitNotFetchedError.code
    this.data = { ref, oid }
  }
}
/** @type {'CommitNotFetchedError'} */
CommitNotFetchedError.code = 'CommitNotFetchedError'
