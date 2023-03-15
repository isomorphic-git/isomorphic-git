/* eslint-env node, browser, jasmine */
const { currentBranch } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('currentBranch', () => {
  it('resolve HEAD to master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toEqual('master')
  })
  it('resolve HEAD to refs/heads/master', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    // Test
    const branch = await currentBranch({
      fs,
      gitdir,
      fullname: true,
    })
    expect(branch).toEqual('refs/heads/master')
  })
  it('returns undefined if HEAD is detached', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-detachedHead')
    // Test
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBeUndefined()
  })
})
