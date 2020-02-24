import { BaseError } from './BaseError.js'

export class InvalidFilepathError extends BaseError {
  /**
   * @param {'leading-slash'|'trailing-slash'} [reason]
   */
  constructor(reason) {
    let message = 'invalid filepath'
    if (reason === 'leading-slash' || reason === 'trailing-slash') {
      message = `"filepath" parameter should not include leading or trailing directory separators because these can cause problems on some platforms.`
    }
    super(message)
    this.code = this.name = InvalidFilepathError.code
    this.data = { reason }
  }
}
/** @type {'InvalidFilepathError'} */
InvalidFilepathError.code = 'InvalidFilepathError'
