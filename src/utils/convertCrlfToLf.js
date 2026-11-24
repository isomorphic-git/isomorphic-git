/**
 * Count the CRLF line endings of content that git guesses is text.
 *
 * The guess follows `gather_stats` and `convert_is_binary` in git's
 * convert.c: the content is binary if it has a NUL byte, a CR that is not
 * followed by LF, or more than one non-printable byte for every 128 printable
 * ones.
 *
 * @param {Uint8Array} buffer
 * @returns {number} 0 for binary content
 */
function countTextCrlf(buffer) {
  let crlf = 0
  let printable = 0
  let nonprintable = 0
  for (let i = 0; i < buffer.length; i++) {
    const c = buffer[i]
    if (c === 13) {
      // CR not followed by LF
      if (buffer[i + 1] !== 10) return 0
      crlf++
      i++
    } else if (c === 10) {
      // LF
    } else if (c === 0) {
      return 0
    } else if (c === 127) {
      nonprintable++
    } else if (c < 32) {
      // BS, HT, ESC and FF count as printable
      if (c === 8 || c === 9 || c === 27 || c === 12) printable++
      else nonprintable++
    } else {
      printable++
    }
  }
  // A trailing EOF (Ctrl-Z) is not counted as non-printable
  if (buffer.length > 0 && buffer[buffer.length - 1] === 26) nonprintable--
  return Math.floor(printable / 128) < nonprintable ? 0 : crlf
}

/**
 * Tell whether a blob is text with CRLF line endings, the test canonical git
 * runs on the blob in the index in `has_crlf_in_index`.
 *
 * @param {Uint8Array} buffer
 * @returns {boolean}
 */
export function hasCrlf(buffer) {
  return buffer.indexOf(13) !== -1 && countTextCrlf(buffer) > 0
}

/**
 * Convert CRLF line endings to LF the way canonical git does when adding a
 * file with `core.autocrlf=true`.
 *
 * Git works on raw bytes, so a leading BOM and non-UTF-8 text are kept as is.
 * Content that git guesses is binary is returned unchanged.
 *
 * @param {Uint8Array} buffer
 * @returns {Uint8Array}
 */
export function convertCrlfToLf(buffer) {
  if (buffer.indexOf(13) === -1) return buffer
  const crlf = countTextCrlf(buffer)
  if (crlf === 0) return buffer

  const result = new Uint8Array(buffer.length - crlf)
  let j = 0
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 13) result[j++] = buffer[i]
  }
  return result
}
