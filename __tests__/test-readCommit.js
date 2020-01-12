/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-readCommit.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { readCommit } = require('isomorphic-git')

describe('readCommit', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('test missing', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readCommit')
    // Test
    let error = null
    try {
      await readCommit({
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
  it('parsed', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readCommit')
    // Test
    const result = await readCommit({
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    expect(result).toMatchSnapshot()
  })
  it('from packfile', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-readCommit')
    // Test
    const result = await readCommit({
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46'
    })
    expect(result).toMatchSnapshot()
  })
})
