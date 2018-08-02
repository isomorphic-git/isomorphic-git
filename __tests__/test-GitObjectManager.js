/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { GitObjectManager } = require('isomorphic-git/internal-apis')

describe('GitObjectManager', () => {
  it('test missing', async () => {
    registerSnapshots(snapshots)
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

  it('expand oid', async () => {
    let repo = await makeFixture('test-GitObjectManager')
    const oid = '033417ae'
    const fullOid = await GitObjectManager.expandOid({...repo, oid})
    expect(fullOid).toEqual('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })

  it('expand oid (not found)', async () => {
    let repo = await makeFixture('test-GitObjectManager')
    const oid = '01234567'
    const fullOid = await GitObjectManager.expandOid({...repo, oid})
    expect(fullOid).toBeUndefined()
  })

  it('expand oid (ambiguous)', async () => {
    let repo = await makeFixture('test-GitObjectManager')
    const oid = '033417a'
    const fullOid = await GitObjectManager.expandOid({...repo, oid})
    expect(fullOid).toBeUndefined()
  })
})
