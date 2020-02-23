import '../typedefs.js'
import { BaseError } from './BaseError.js'

export class NoteExistsError extends BaseError {
  /**
   * @param {string} note
   * @param {string} oid
   */
  constructor(note, oid) {
    super(
      `A note object ${note} already exists on object ${oid}. Use 'force: true' parameter to overwrite existing notes.`
    )
    this.code = this.name = NoteExistsError.code
    this.data = { note, oid }
  }
}
/** @type {'NoteExistsError'} */
NoteExistsError.code = 'NoteExistsError'
