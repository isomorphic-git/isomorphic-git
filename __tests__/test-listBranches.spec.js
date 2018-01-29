/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('..')

describe('listBranches', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-listBranches.snap'), 'listBranches')
  })
  it('listBranches', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    let commits = await listBranches({ fs, gitdir })
    expectjs(commits).toMatchSnapshot()
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
    expectjs(commits).toMatchSnapshot()
  })
})
