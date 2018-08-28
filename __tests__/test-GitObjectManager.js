/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const GitObjectManager = require('isomorphic-git/internal-apis')

describe('GitObjectManager', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('test missing', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    // Test
    let error = null
    try {
      await GitObjectManager.readObject({
        fs,
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error).toMatchSnapshot()
  })
})
