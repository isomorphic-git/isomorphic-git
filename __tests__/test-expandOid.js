/* eslint-env node, browser, jasmine */
const { Errors, expandOid } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('expandOid', () => {
  it('expand short oid', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-expandOid')
    let oid = '033417ae'
    // Test
    oid = await expandOid({ fs, gitdir, oid })
    expect(oid).toEqual('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })

  it('expand short oid (not found)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-expandOid')
    const oid = '01234567'
    // Test
    let error = null
    try {
      await expandOid({ fs, gitdir, oid })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })

  it('expand short oid (ambiguous)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-expandOid')
    const oid = '033417a'
    // Test
    let error = null
    try {
      await expandOid({ fs, gitdir, oid })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.AmbiguousError).toBe(true)
  })

  it('expand short oid from packfile', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-expandOid')
    let oid = '5f1f014'
    // Test
    oid = await expandOid({ fs, gitdir, oid })
    expect(oid).toEqual('5f1f014326b1d7e8079d00b87fa7a9913bd91324')
  })
})
