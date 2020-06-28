/**
 * @param {Map} map
 */
export function fromEntries(map) {
  /** @type {Object<string, string>} */
  const o = {}
  for (const [key, value] of map) {
    o[key] = value
  }
  return o
}
