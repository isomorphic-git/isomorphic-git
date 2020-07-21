/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { readBlob } = require('isomorphic-git')

const { applyDelta, createDelta } = require('isomorphic-git/internal-apis')

/*
0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF
the quick brown fox jumps over the slow lazy dog
over the slow lazy dog the quick brown fox jumps
*/

describe('createDelta', () => {
  it('the quick brown fox', () => {
    // Test
    const object = Buffer.from(
      `the quick brown fox jumps over the slow lazy dog`
    )
    const base = Buffer.from(`over the slow lazy dog the quick brown fox jumps`)
    const delta = createDelta(object, base)
    expect([...delta]).toMatchInlineSnapshot(`
      Array [
        48,
        48,
        145,
        23,
        25,
        1,
        32,
        144,
        22,
      ]
    `)
    const reconstructed = applyDelta(delta, base)
    expect(reconstructed.toString('utf8')).toEqual(object.toString('utf8'))
  })
  it('some JavaScript code', async () => {
    // c60bbbe99e96578105c57c4b3f2b6ebdf863edbc commit 1088 832 12
    // e05547ea87ea55eff079de295ff56f483e5b4439 commit 1080 818 844
    // ebdedf722a3ec938da3fd53eb74fdea55c48a19d commit 1065 806 1662
    // 0518502faba1c63489562641c36a989e0f574d95 commit 1081 817 2468
    // Setup
    const { fs, gitdir } = await makeFixture('test-listObjects')
    const { blob: _object } = await readBlob({
      fs,
      gitdir,
      oid: 'e05547ea87ea55eff079de295ff56f483e5b4439',
      filepath: 'src/managers/GitRemoteHTTP.js',
    })
    const object = Buffer.from(_object)
    const { blob: _base } = await readBlob({
      fs,
      gitdir,
      oid: 'c60bbbe99e96578105c57c4b3f2b6ebdf863edbc',
      filepath: 'src/managers/GitRemoteHTTP.js',
    })
    const base = Buffer.from(_base)
    // Test
    const delta = createDelta(object, base)
    // The two objects are very similar so it should have a very small delta.
    expect(delta.byteLength).toMatchInlineSnapshot(`57`)
    // The reconstructed object should match the original
    const reconstructed = applyDelta(delta, base)
    expect(reconstructed.toString('utf8')).toEqual(object.toString('utf8'))
  })
})
