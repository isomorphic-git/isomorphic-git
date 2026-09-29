// Code units from U+D800 up. Only these can make the two orders differ.
const NEEDS_CODE_POINT_ORDER = /[\ud800-￿]/

// Is the code unit at index i a surrogate with no partner? Such a unit is not valid Unicode.
// A high surrogate needs a low one after it. A low surrogate needs a high one before it.
function isLoneSurrogate(s, i, unit) {
  if (unit < 0xd800 || unit > 0xdfff) return false
  if (unit < 0xdc00) {
    const next = i + 1 < s.length ? s.charCodeAt(i + 1) : 0
    return next < 0xdc00 || next > 0xdfff
  }
  const prev = i > 0 ? s.charCodeAt(i - 1) : 0
  return prev < 0xd800 || prev > 0xdbff
}

/**
 * Compare two strings by code point. This gives the same order as the UTF-8 bytes of the
 * strings, and git sorts paths in that order. The `<` operator compares UTF-16 code units,
 * so it puts a character above U+FFFF (a surrogate pair) before the characters from U+E000
 * to U+FFFF. Git puts it after them. A lone surrogate counts as U+FFFD, because the UTF-8
 * encoding of the path writes it that way.
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
      if (isLoneSurrogate(a, i, x)) x = 0xfffd
      if (isLoneSurrogate(b, i, y)) y = 0xfffd
      if (x === y) continue
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
