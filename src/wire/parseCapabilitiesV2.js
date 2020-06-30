// @ts-check

/**
 * @param {function} read
 */
export async function parseCapabilitiesV2(read) {
  /** @type {Object<string, string | true>} */
  const capabilities2 = {}

  let line
  while (true) {
    line = await read()
    if (line === true) break
    if (line === null) continue
    line = line.toString('utf8').replace(/\n$/, '')
    const i = line.indexOf('=')
    if (i > -1) {
      const key = line.slice(0, i)
      const value = line.slice(i + 1)
      capabilities2[key] = value
    } else {
      capabilities2[line] = true
    }
  }
  return { protocolVersion: 2, capabilities2 }
}
