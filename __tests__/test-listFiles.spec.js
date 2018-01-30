/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-listFiles.js.snap')
const { listFiles } = require('..')

describe('listFiles', () => {
  it('listFiles', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listFiles')
    // Test
    const files = await listFiles({ fs, gitdir })
    assertSnapshot(files, snapshots, `listFiles listFiles 1`)
  })
})
