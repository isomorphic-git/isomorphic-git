/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-resetIndex.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { resetIndex, listFiles } = require('isomorphic-git')

describe('resetIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('modified', async () => {
    // Setup
    const { gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    const before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ dir, gitdir, filepath: 'a.txt' })
    const after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length).toBe(true)
  })
  it('new', async () => {
    // Setup
    const { gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    const before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ dir, gitdir, filepath: 'd.txt' })
    const after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
})
