/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('isomorphic-git')

describe('listBranches', () => {
  it('listBranches', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listBranches')
    // Test
    let commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchSnapshot()
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
    expect(commits).toMatchSnapshot()
  })
})
