/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-resetIndex.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { resetIndex, listFiles } = require('isomorphic-git')

describe('resetIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('modified', async () => {
    // Setup
    let { gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    let before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ dir, gitdir, filepath: 'a.txt' })
    let after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length).toBe(true)
  })
  it('new', async () => {
    // Setup
    let { gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    let before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ dir, gitdir, filepath: 'd.txt' })
    let after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
})
