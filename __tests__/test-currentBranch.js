/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { currentBranch } = require('isomorphic-git')

describe('currentBranch', () => {
  it('resolve HEAD to master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-resolveRef')
    // Test
    const branch = await currentBranch({
      gitdir
    })
    expect(branch).toEqual('master')
  })
  it('resolve HEAD to refs/heads/master', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-resolveRef')
    // Test
    const branch = await currentBranch({
      gitdir,
      fullname: true
    })
    expect(branch).toEqual('refs/heads/master')
  })
  it('returns undefined if HEAD is detached', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-detachedHead')
    // Test
    const branch = await currentBranch({
      gitdir
    })
    expect(branch).toBeUndefined()
  })
})
