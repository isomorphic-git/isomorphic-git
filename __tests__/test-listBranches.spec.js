/* global describe it expect */
const snapshots = require('./__snapshots__/test-listBranches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('..')

describe('listBranches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listBranches', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    let commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchSnapshot2()
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
    expect(commits).toMatchSnapshot2()
  })
})
