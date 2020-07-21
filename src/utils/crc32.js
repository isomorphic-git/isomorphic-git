import _crc32 from 'crc-32'

/**
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function crc32(bytes) {
  return _crc32.buf(bytes) >>> 0
}
