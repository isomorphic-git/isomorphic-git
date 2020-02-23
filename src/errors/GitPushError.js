import '../typedefs.js'
import { BaseError } from './BaseError.js'

export class GitPushError extends BaseError {
  /**
   * @param {string} prettyDetails
   * @param {PushResult} prettyDetails
   */
  constructor(prettyDetails, result) {
    super(`One or more branches were not updated: ${prettyDetails}`)
    /** @type {'GitPushError'} */
    this.code = this.name = 'GitPushError'
    this.data = { prettyDetails, result }
  }
}
