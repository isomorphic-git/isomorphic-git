/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { readObject } = require('isomorphic-git/internal-apis')

describe('GitObjectManager', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('test missing', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-GitObjectManager')
    // Test
    let error = null
    try {
      await readObject({
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
