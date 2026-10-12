import { BaseError } from './BaseError.js'

export class MergeInProgressError extends BaseError {
  /**
   * @param {'MERGE_HEAD'|'CHERRY_PICK_HEAD'} file - the file that records it
   */
  constructor(file) {
    super(
      `You have not concluded your ${
        file === 'MERGE_HEAD' ? 'merge' : 'cherry-pick'
      } (${file} exists). Commit or abort it first.`
    )
    this.code = this.name = MergeInProgressError.code
    this.data = { file }
  }
}
/** @type {'MergeInProgressError'} */
MergeInProgressError.code = 'MergeInProgressError'
