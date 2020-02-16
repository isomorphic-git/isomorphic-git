/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { E, readObject } = require('isomorphic-git/internal-apis')

describe('GitObjectManager', () => {
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
    expect(error.code).toBe(E.ReadObjectFail)
  })
})
