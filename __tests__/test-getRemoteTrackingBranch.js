/* eslint-env node, browser, jasmine */
const { getRemoteTrackingBranch } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('getRemoteTrackingBranch', () => {
  it('gets the local branch matching', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-getRemoteTrackingBranch')
    // Test
    const trackedBranch = await getRemoteTrackingBranch({
      fs,
      gitdir,
      ref: 'test',
    })
    expect(trackedBranch).toBe('refs/remotes/bar/test')
  })
})
