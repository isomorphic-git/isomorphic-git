/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { currentBranch } = require('isomorphic-git')

describe('currentBranch', () => {
  it('resolve HEAD to master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let branch = await currentBranch({
      fs,
      gitdir
    })
    expect(branch).toEqual('master')
  })
  it('resolve HEAD to refs/heads/master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    let branch = await currentBranch({
      fs,
      gitdir,
      fullname: true
    })
    expect(branch).toEqual('refs/heads/master')
  })
})
