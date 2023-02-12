import { BaseError } from './BaseError.js'

export class UnmergedPathsError extends BaseError {
  /**
   * @param {Array<string>} filepaths
   */
  constructor(filepaths) {
    super(
      `Modifying the index is not possible because you have unmerged files: ${filepaths.toString}. Fix them up in the work tree, and then use 'git add/rm as appropriate to mark resolution and make a commit.`
    )
    this.code = this.name = UnmergedPathsError.code
    this.data = { filepaths }
  }
}
/** @type {'UnmergedPathsError'} */
UnmergedPathsError.code = 'UnmergedPathsError'
