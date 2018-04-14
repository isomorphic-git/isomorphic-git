/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-remove.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { remove, listFiles } = require('isomorphic-git')

describe('remove', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('file', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    // Test
    let before = await listFiles({ fs, gitdir })
    expect(before).toMatchSnapshot()
    await remove({ fs, gitdir, filepath: 'LICENSE.md' })
    let after = await listFiles({ fs, gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
  it('dir', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    // Test
    let before = await listFiles({ fs, gitdir })
    expect(before).toMatchSnapshot()
    await remove({ fs, gitdir, filepath: 'src/models' })
    let after = await listFiles({ fs, gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
