/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { GitObjectManager } = require('isomorphic-git/internal-apis')

describe('GitObjectManager', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('test missing', async () => {
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    let error = null
    try {
      await GitObjectManager.read({
        fs,
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      error = err
    }
    expect(error).toMatchSnapshot()
  })

  it('test shallow', async () => {
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    let error = null
    try {
      await GitObjectManager.read({
        fs,
        gitdir,
        oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
      })
    } catch (err) {
      error = err
    }
    expect(error).toMatchSnapshot()
  })
})
