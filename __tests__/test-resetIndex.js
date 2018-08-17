/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-remove.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { resetIndex, listFiles } = require('isomorphic-git')

describe('resetIndex', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('modified', async () => {
    // Setup
    let { fs, gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    let before = await listFiles({ fs, gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ fs, dir, gitdir, filepath: 'a.txt' })
    let after = await listFiles({ fs, gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length).toBe(true)
  })
  it('new', async () => {
    // Setup
    let { fs, gitdir, dir } = await makeFixture('test-resetIndex')
    // Test
    let before = await listFiles({ fs, gitdir })
    expect(before).toMatchSnapshot()
    await resetIndex({ fs, dir, gitdir, filepath: 'd.txt' })
    let after = await listFiles({ fs, gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
})
