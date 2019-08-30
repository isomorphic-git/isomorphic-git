/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-remove.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { remove, listFiles } = require('isomorphic-git')

describe('remove', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('file', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-remove')
    // Test
    const before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await remove({ gitdir, filepath: 'LICENSE.md' })
    const after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
  it('dir', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-remove')
    // Test
    const before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await remove({ gitdir, filepath: 'src/models' })
    const after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
