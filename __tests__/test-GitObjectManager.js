/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { managers } = require('isomorphic-git/internal-apis')
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
    expect(ref).toMatchSnapshot()
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
    expect(ref).toMatchSnapshot()
  })
})
