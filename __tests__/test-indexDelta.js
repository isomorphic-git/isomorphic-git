/* eslint-env node, browser, jasmine */
const { indexDelta, findAMatch, findLongestMatch } = require('isomorphic-git/internal-apis')

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
      Map {
        "74686520717569636b2062726f776e20" => Array [
          0,
        ],
        "666f78206a756d7073206f7665722074" => Array [
          1,
        ],
        "686520736c6f77206c617a7920646f67" => Array [
          2,
        ],
      }
    `)
    expect(target).toMatchInlineSnapshot(`
      Map {
        "6f7665722074686520736c6f77206c61" => Array [
          0,
        ],
        "7a7920646f672074686520717569636b" => Array [
          1,
        ],
        "2062726f776e20666f78206a756d7073" => Array [
          2,
        ],
      }
    `)
  })
  it('findAMatch', () => {
    // Setup
    const source = Buffer.from(
      `the quick brown fox jumps over the slow lazy dog`
    )
    const target = indexDelta(
      Buffer.from(`over the slow lazy dog the quick brown fox jumps`)
    )
    // Test
    const indexes = findAMatch(source, target)
    expect(indexes).toMatchInlineSnapshot(`
      Array [
        32,
      ]
    `)
  })
  it('findLongestMatch', () => {
    // Setup
    const source = Buffer.from(
      `the quick brown fox jumps over the slow lazy dog`
    )
    const target = Buffer.from(
      `over the slow lazy dog the quick brown fox jumps`
      // `over the slow la|zy dog the quick| brown fox jumps`
    )
    const index = indexDelta(target)
    // Test
    const indexes = findLongestMatch(source, index, target)
    expect(indexes).toMatchInlineSnapshot(`
      Array [
        "74686520717569636b",
        Array [
          32,
          16,
        ],
        "20",
        Array [
          0,
          22,
        ],
      ]
    `)
  })
})
