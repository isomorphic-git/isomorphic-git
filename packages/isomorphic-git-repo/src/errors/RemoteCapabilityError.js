import { BaseError } from './BaseError.js'

export class RemoteCapabilityError extends BaseError {
  /**
   * @param {'shallow'|'deepen-since'|'deepen-not'|'deepen-relative'} capability
   * @param {'depth'|'since'|'exclude'|'relative'} parameter
   */
  constructor(capability, parameter) {
    super(
      `Remote does not support the "${capability}" so the "${parameter}" parameter cannot be used.`
    )
    this.code = this.name = RemoteCapabilityError.code
    this.data = { capability, parameter }
  }
}
/** @type {'RemoteCapabilityError'} */
RemoteCapabilityError.code = 'RemoteCapabilityError'
