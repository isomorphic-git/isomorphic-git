import { InternalError } from '../errors/InternalError.js'

/**
 * Represents a Git object and provides methods to wrap and unwrap Git objects
 * according to the Git object format.
 */
export class GitObject {
  /**
   * Wraps a raw object with a Git header.
   *
   * @param {Object} params - The parameters for wrapping.
   * @param {string} params.type - The type of the Git object (e.g., 'blob', 'tree', 'commit').
   * @param {Uint8Array} params.object - The raw object data to wrap.
   * @returns {Uint8Array} The wrapped Git object as a single buffer.
   */
  static wrap({ type, object }) {
    const header = `${type} ${object.length}\x00`
    const headerLen = header.length
    const totalLength = headerLen + object.length

    // Allocate a single buffer for the header and object, rather than create multiple buffers
    const wrappedObject = new Uint8Array(totalLength)
    for (let i = 0; i < headerLen; i++) {
      wrappedObject[i] = header.charCodeAt(i)
    }
    wrappedObject.set(object, headerLen)

    return wrappedObject
  }

  /**
   * Unwraps a Git object buffer into its type and raw object data.
   *
   * @param {Buffer|Uint8Array} buffer - The buffer containing the wrapped Git object.
   * @returns {{ type: string, object: Buffer }} An object containing the type and the raw object data.
   * @throws {InternalError} If the length specified in the header does not match the actual object length.
   */
  static unwrap(buffer) {
    const s = buffer.indexOf(32) // first space
    const i = buffer.indexOf(0) // first null value
    const type = buffer.slice(0, s).toString('utf8') // get type of object
    const length = buffer.slice(s + 1, i).toString('utf8') // get type of object
    const actualLength = buffer.length - (i + 1)
    // verify length
    if (parseInt(length) !== actualLength) {
      throw new InternalError(
        `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`
      )
    }
    return {
      type,
      object: Buffer.from(buffer.slice(i + 1)),
    }
  }
}
