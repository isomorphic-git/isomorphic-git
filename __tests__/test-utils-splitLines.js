/* eslint-env node, browser, jasmine */
import { splitLines } from 'isomorphic-git/internal-apis'

async function collect(chunks) {
  const fifo = splitLines(
    (async function* () {
      for (const chunk of chunks) yield chunk
    })()
  )
  const lines = []
  while (true) {
    const result = await fifo.next()
    if (result.done) break
    lines.push(result.value)
  }
  return lines
}

describe('utils/splitLines', () => {
  it('splits on LF, CR and CRLF', async () => {
    expect(await collect(['a\nb'])).toEqual(['a\n', 'b'])
    expect(await collect(['a\rb'])).toEqual(['a\r', 'b'])
    expect(await collect(['a\r\nb'])).toEqual(['a\r\n', 'b'])
  })

  it('does not split a CRLF that straddles two chunks', async () => {
    // The same bytes, delivered in one chunk or two, must produce the same
    // lines. Sockets decide where the boundary falls, the caller does not.
    expect(await collect(['a\r', '\nb'])).toEqual(await collect(['a\r\nb']))
  })

  it('emits a trailing lone CR once the stream ends', async () => {
    expect(await collect(['a\r'])).toEqual(['a\r'])
  })

  it('keeps a CR that is followed by something other than LF', async () => {
    expect(await collect(['a\r', 'b'])).toEqual(['a\r', 'b'])
  })
})
