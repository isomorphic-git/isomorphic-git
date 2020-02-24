import { BaseError } from './BaseError.js'

export class UrlParseError extends BaseError {
  /**
   * @param {string} url
   */
  constructor(url) {
    super(`Cannot parse remote URL: "${url}"`)
    this.code = this.name = UrlParseError.code
    this.data = { url }
  }
}
/** @type {'UrlParseError'} */
UrlParseError.code = 'UrlParseError'
