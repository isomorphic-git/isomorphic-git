import { BaseError } from './BaseError.js'

export class RebaseNotSupportedError extends BaseError {
  /**
   * @param {string} feature
   */
  constructor(feature) {
    super(
      `This rebase uses ${feature}, which is not supported yet. Use git to continue or abort it.`
    )
    this.code = this.name = RebaseNotSupportedError.code
    this.data = { feature }
  }
}
/** @type {'RebaseNotSupportedError'} */
RebaseNotSupportedError.code = 'RebaseNotSupportedError'
