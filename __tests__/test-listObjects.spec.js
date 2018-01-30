/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-listObjects.js.snap')
const { listObjects } = require('../dist/internal.umd.min.js')

describe('listObjects', () => {
  it('listObjects', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listObjects')
    // Test
    let objects = await listObjects({
      fs,
      gitdir,
      oids: [
        'c60bbbe99e96578105c57c4b3f2b6ebdf863edbc',
        'e05547ea87ea55eff079de295ff56f483e5b4439',
        'ebdedf722a3ec938da3fd53eb74fdea55c48a19d',
        '0518502faba1c63489562641c36a989e0f574d95'
      ]
    })
    assertSnapshot([...objects], snapshots, `listObjects listObjects 1`)
  })
})
