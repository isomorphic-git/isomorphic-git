/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { plugins, currentBranch } = require('isomorphic-git')

describe('currentBranch', () => {
  it('resolve HEAD to master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    plugins.set('fs', fs)
    // Test
    let branch = await currentBranch({
      gitdir
    })
    expect(branch).toEqual('master')
  })
  it('resolve HEAD to refs/heads/master', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-resolveRef')
    plugins.set('fs', fs)
    // Test
    let branch = await currentBranch({
      gitdir,
      fullname: true
    })
    expect(branch).toEqual('refs/heads/master')
  })
  it.only('returns undefined if HEAD is detached', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-detachedHead')
    plugins.set('fs', fs)
    // Test
    let branch = await currentBranch({
      gitdir
    })
    expect(branch).toBeUndefined()
  })
})
