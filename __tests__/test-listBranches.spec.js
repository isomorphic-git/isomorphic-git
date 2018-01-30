/* global describe it expect */
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-listBranches.js.snap')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('..')

describe('listBranches', () => {
  it('listBranches', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    let commits = await listBranches({ fs, gitdir })
    assertSnapshot(commits, snapshots, `listBranches listBranches 1`)
  })
  it('remote', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    let commits = await listBranches({
      fs,
      gitdir,
      remote: 'origin'
    })
    assertSnapshot(commits, snapshots, `listBranches remote 1`)
  })
})
