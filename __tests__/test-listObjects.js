/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-listObjects.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { listObjects } = require('isomorphic-git/internal-apis')

describe('listObjects', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listObjects', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listObjects')
    // Test
    const objects = await listObjects({
      fs,
      gitdir,
      oids: [
        'c60bbbe99e96578105c57c4b3f2b6ebdf863edbc',
        'e05547ea87ea55eff079de295ff56f483e5b4439',
        'ebdedf722a3ec938da3fd53eb74fdea55c48a19d',
        '0518502faba1c63489562641c36a989e0f574d95'
      ]
    })
    expect([...objects]).toMatchSnapshot()
  })
})
