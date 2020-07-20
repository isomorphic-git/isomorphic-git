/* eslint-env node, browser, jasmine */
// const { makeFixture } = require('./__helpers__/FixtureFS.js')

// const { readBlob } = require('isomorphic-git')

const {
  indexDelta,
  findAMatch,
  findLongestMatch,
} = require('isomorphic-git/internal-apis')

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
  // it('createDelta', async () => {
  //   // c60bbbe99e96578105c57c4b3f2b6ebdf863edbc commit 1088 832 12
  //   // e05547ea87ea55eff079de295ff56f483e5b4439 commit 1080 818 844
  //   // ebdedf722a3ec938da3fd53eb74fdea55c48a19d commit 1065 806 1662
  //   // 0518502faba1c63489562641c36a989e0f574d95 commit 1081 817 2468
  //   // Setup
  //   const { fs, gitdir } = await makeFixture('test-listObjects')
  //   const source = readBlob({
  //     fs,
  //     gitdir,
  //     oid: 'c60bbbe99e96578105c57c4b3f2b6ebdf863edbc',
  //     filepath: 'src/commands/fetch.js',
  //   })
  //   const target = readBlob({
  //     fs,
  //     gitdir,
  //     oid: 'e05547ea87ea55eff079de295ff56f483e5b4439',
  //     filepath: 'src/commands/fetch.js',
  //   })
  //   // Test
  //   const delta = createDelta(source, target)

  // })
})
