/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-listTags.js.snap')
const { listTags } = require('..')

describe('listTags', () => {
  it('listTags', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listTags')
    // Test
    let refs = await listTags({
      fs,
      gitdir
    })
    assertSnapshot(refs, snapshots, `listTags listTags 1`)
  })
})
