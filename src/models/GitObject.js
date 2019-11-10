import { E, GitError } from '../models/GitError.js'
import { TinyBuffer } from '../utils/TinyBuffer.js'

export class GitObject {
  static wrap ({ type, object }) {
    return TinyBuffer.concat([
      TinyBuffer.from(`${type} ${object.byteLength.toString()}\x00`),
      TinyBuffer.from(object)
    ])
  }

  static unwrap (buffer) {
    const s = buffer.indexOf(32) // first space
    const i = buffer.indexOf(0) // first null value
    const type = buffer.slice(0, s).toString('utf8') // get type of object
    const length = buffer.slice(s + 1, i).toString('utf8') // get type of object
    const actualLength = buffer.length - (i + 1)
    // verify length
    if (parseInt(length) !== actualLength) {
      throw new GitError(E.InternalFail, {
        message: `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`
      })
    }
    return {
      type,
      object: TinyBuffer.from(buffer.slice(i + 1))
    }
  }
}
