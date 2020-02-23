import { BaseError } from './BaseError.js'

export class MaxDepthError extends BaseError {
  /**
   * @param {number} depth
   */
  constructor(depth) {
    super(`Maximum search depth of ${depth} exceeded.`)
    this.code = this.name = MaxDepthError.code
    this.data = { depth }
  }
}
/** @type {'MaxDepthError'} */
MaxDepthError.code = 'MaxDepthError'
