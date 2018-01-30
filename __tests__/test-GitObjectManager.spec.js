/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const { managers } = require('../dist/internal.umd.min.js')
const { GitObjectManager } = managers

describe('GitObjectManager', () => {
  it('test missing', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitObjectManager')
    try {
      var ref = await GitObjectManager.read({
        fs,
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      var ref = err
    }
    assertSnapshot(ref, snapshots, 'GitObjectManager test missing 1')
  })

  it('test shallow', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-GitObjectManager')
    try {
      var ref = await GitObjectManager.read({
        fs,
        gitdir,
        oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
      })
    } catch (err) {
      var ref = err
    }
    assertSnapshot(ref, snapshots, 'GitObjectManager test shallow 1')
  })
})
