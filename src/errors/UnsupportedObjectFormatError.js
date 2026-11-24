import { BaseError } from './BaseError.js'

export class UnsupportedObjectFormatError extends BaseError {
  /**
   * @param {string} objectFormat
   */
  constructor(objectFormat) {
    super(
      `This repository uses the "${objectFormat}" object format (extensions.objectFormat), which isomorphic-git does not support. Only "sha1" repositories can be read or written.`
    )
    this.code = this.name = UnsupportedObjectFormatError.code
    this.data = { objectFormat }
  }
}
/** @type {'UnsupportedObjectFormatError'} */
UnsupportedObjectFormatError.code = 'UnsupportedObjectFormatError'
