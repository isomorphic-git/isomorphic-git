/* eslint-env node, browser, jasmine */
// @ts-ignore
const snapshots = require('./__snapshots__/test-listBranches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('isomorphic-git')

describe('listBranches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listBranches', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-listBranches')
    // Test
    const commits = await listBranches({ gitdir })
    expect(commits).toMatchSnapshot()
  })
  it('remote', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-listBranches')
    // Test
    const commits = await listBranches({
      gitdir,
      remote: 'origin'
    })
    expect(commits).toMatchSnapshot()
  })
})
