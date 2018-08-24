/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-GitObjectManager.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { E } = require('isomorphic-git')
const { GitObjectManager } = require('isomorphic-git/internal-apis')

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
      await GitObjectManager.read({
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

  it('expand short oid', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    let oid = '033417ae'
    // Test
    oid = await GitObjectManager.expandOid({ fs, gitdir, oid })
    expect(oid).toEqual('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })

  it('expand short oid (not found)', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    let oid = '01234567'
    // Test
    let error = null
    try {
      await GitObjectManager.expandOid({ fs, gitdir, oid })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.ShortOidNotFound)
  })

  it('expand short oid (ambiguous)', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-GitObjectManager')
    let oid = '033417a'
    // Test
    let error = null
    try {
      await GitObjectManager.expandOid({ fs, gitdir, oid })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.AmbiguousShortOid)
  })

  it('expand short oid from packfile', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-GitPackIndex')
    let oid = '5f1f014'
    // Test
    oid = await GitObjectManager.expandOid({ fs, gitdir, oid })
    expect(oid).toEqual('5f1f014326b1d7e8079d00b87fa7a9913bd91324')
  })
})
