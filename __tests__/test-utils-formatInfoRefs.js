/* eslint-env node, browser, jasmine */
import { formatInfoRefs } from 'isomorphic-git/internal-apis'

const remote = () => ({
  refs: new Map([
    ['refs/tags/v1', 'aaaaaaa'],
    ['refs/tags/v1^{}', 'bbbbbbb'],
  ]),
  symrefs: new Map(),
})

describe('utils/formatInfoRefs', () => {
  it('attaches a peeled tag to the tag it belongs to', async () => {
    expect(formatInfoRefs(remote(), '', false, true)).toEqual([
      { ref: 'refs/tags/v1', oid: 'aaaaaaa', peeled: 'bbbbbbb' },
    ])
  })

  it('leaves the peeled oid off when peelTags is false', async () => {
    expect(formatInfoRefs(remote(), '', false, false)).toEqual([
      { ref: 'refs/tags/v1', oid: 'aaaaaaa' },
    ])
  })

  it('skips a peeled tag whose own tag the prefix filtered out', async () => {
    // The peeled name is longer than the tag name, so a prefix can match one
    // and not the other. `listServerRefs` passes `prefix` straight through.
    expect(formatInfoRefs(remote(), 'refs/tags/v1^', false, true)).toEqual([])
  })
})
