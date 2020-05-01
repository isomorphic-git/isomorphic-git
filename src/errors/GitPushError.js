import 'typedefs'
import { BaseError } from 'BaseError'

export class GitPushError extends BaseError {
  /**
   * @param {string} prettyDetails
   * @param {PushResult} result
   */
  constructor(prettyDetails, result) {
    super(`One or more branches were not updated: ${prettyDetails}`)
    this.code = this.name = GitPushError.code
    this.data = { prettyDetails, result }
  }
}
/** @type {'GitPushError'} */
GitPushError.code = 'GitPushError'
