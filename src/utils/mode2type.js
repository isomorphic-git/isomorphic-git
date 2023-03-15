import { InternalError } from '../errors/InternalError.js'

/**
 *
 * @param {number} mode
 */
export function mode2type(mode) {
  // prettier-ignore
  switch (mode) {
    case 0o040000: return 'tree'
    case 0o100644: return 'blob'
    case 0o100755: return 'blob'
    case 0o120000: return 'blob'
    case 0o160000: return 'commit'
  }
  throw new InternalError(`Unexpected GitTree entry mode: ${mode.toString(8)}`)
}
