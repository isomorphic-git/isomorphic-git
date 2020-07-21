/* eslint-env node, browser, jasmine */
// const { makeFixture } = require('./__helpers__/FixtureFS.js')

// const { readBlob } = require('isomorphic-git')

const { indexDelta } = require('isomorphic-git/internal-apis')

describe('indexDelta', () => {
  it('indexDelta', () => {
    // Test
    const source = indexDelta(
      Buffer.from(`the quick brown fox jumps over the slow lazy dog`)
    )
    const target = indexDelta(
      Buffer.from(`over the slow lazy dog the quick brown fox jumps`)
    )
    expect(source).toMatchInlineSnapshot(`
      Object {
        "chunkSize": 16,
        "index": Map {
          3743699201 => Array [
            0,
          ],
          2550977668 => Array [
            1,
          ],
          1337689279 => Array [
            2,
          ],
        },
      }
    `)
    expect(target).toMatchInlineSnapshot(`
      Object {
        "chunkSize": 16,
        "index": Map {
          1385484582 => Array [
            0,
          ],
          3818689224 => Array [
            1,
          ],
          4183131470 => Array [
            2,
          ],
        },
      }
    `)
  })
})
