import { E, GitError } from '../models/GitError.js'

export class GitObject {
  static wrap ({ type, object }) {
    return Buffer.concat([
      Buffer.from(`${type} ${object.byteLength.toString()}\0`),
      Buffer.from(object)
    ])
  }
  static unwrap (buffer) {
    let s = buffer.indexOf(32) // first space
    let i = buffer.indexOf(0) // first null value
    let type = buffer.slice(0, s).toString('utf8') // get type of object
    let length = buffer.slice(s + 1, i).toString('utf8') // get type of object
    let actualLength = buffer.length - (i + 1)
    // verify length
    if (parseInt(length) !== actualLength) {
      throw new GitError(E.InternalFail, {
        message: `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`
      })
    }
    return {
      type,
      object: Buffer.from(buffer.slice(i + 1))
    }
  }
}
