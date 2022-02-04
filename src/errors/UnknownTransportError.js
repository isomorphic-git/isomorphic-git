import { BaseError } from './BaseError.js'

export class UnknownTransportError extends BaseError {
  /**
   * @param {string} url
   * @param {string} transport
   * @param {string} [suggestion]
   */
  constructor(url, transport, suggestion) {
    super(
      `Git remote "${url}" uses an unrecognized transport protocol: "${transport}"`
    )
    this.code = this.name = UnknownTransportError.code
    this.data = { url, transport, suggestion }
  }
}
/** @type {'UnknownTransportError'} */
UnknownTransportError.code = 'UnknownTransportError'
