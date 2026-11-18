import { bool } from '../models/GitConfig.js'

/**
 * Tell whether a `core.autocrlf` value makes git convert CRLF to LF when a
 * file goes into the repository. That is `input` and every spelling of a true
 * boolean: `true`, `yes`, `on` and `1`, in any case.
 *
 * @param {string|boolean} [value] - the raw `core.autocrlf` config value
 * @returns {boolean}
 */
export function isAutocrlf(value) {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim().toLowerCase() === 'input') {
    return true
  }
  try {
    return bool(value)
  } catch (err) {
    return false
  }
}
