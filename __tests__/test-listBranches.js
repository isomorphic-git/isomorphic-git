/* eslint-env node, browser, jasmine */
const snapshots = require('./__snapshots__/test-listBranches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { plugins, listBranches } = require('isomorphic-git')

describe('listBranches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listBranches', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    plugins.set('fs', fs)
    // Test
    let commits = await listBranches({ gitdir })
    expect(commits).toMatchSnapshot()
  })
  it('remote', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    plugins.set('fs', fs)
    // Test
    let commits = await listBranches({
      gitdir,
      remote: 'origin'
    })
    expect(commits).toMatchSnapshot()
  })
})
