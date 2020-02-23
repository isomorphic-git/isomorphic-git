import { BaseError } from './BaseError.js'

export class ResolveRefError extends BaseError {
  /**
   * @param {string} ref
   */
  constructor(ref) {
    super(`Could not resolve reference "${ref}".`)
    this.code = this.name = ResolveRefError.code
    this.data = { ref }
  }
}
/** @type {'ResolveRefError'} */
ResolveRefError.code = 'ResolveRefError'
