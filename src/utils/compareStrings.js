// Code units from U+D800 up. Only these can make the two orders differ.
const NEEDS_CODE_POINT_ORDER = /[\ud800-￿]/

/**
 * Compare two strings by code point. This gives the same order as the UTF-8 bytes of the
 * strings, and git sorts paths in that order. The `<` operator compares UTF-16 code units,
 * so it puts a character above U+FFFF (a surrogate pair) before the characters from U+E000
 * to U+FFFF. Git puts it after them.
 *
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
export function compareStrings(a, b) {
  if (!NEEDS_CODE_POINT_ORDER.test(a) && !NEEDS_CODE_POINT_ORDER.test(b)) {
    // Both orders are the same, and the `<` operator is the fastest way.
    return -(a < b) || +(a > b)
  }
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i++) {
    let x = a.charCodeAt(i)
    let y = b.charCodeAt(i)
    if (x !== y) {
      // Move the surrogates (U+D800 to U+DFFF) above U+FFFF, where their code points are.
      if (x >= 0xd800 && y >= 0xd800) {
        x += x >= 0xe000 ? -0x800 : 0x2000
        y += y >= 0xe000 ? -0x800 : 0x2000
      }
      return x < y ? -1 : 1
    }
  }
  return a.length < b.length ? -1 : a.length > b.length ? 1 : 0
}
