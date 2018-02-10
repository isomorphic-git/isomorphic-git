/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { listBranches } = require('isomorphic-git')

describe('listBranches', () => {
  it('listBranches', async () => {
    let { fs, gitdir } = await makeFixture('test-listBranches')
    let commits = await listBranches({ fs, gitdir })
    expect(commits).toMatchSnapshot()
  })
  it('remote', async () => {
    let { fs, gitdir } = await makeFixture('test-listBranches')
    let commits = await listBranches({ fs, gitdir, remote: 'origin' })
    expect(commits).toMatchSnapshot()
  })
})
