/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-remove.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { plugins, remove, listFiles } = require('isomorphic-git')

describe('remove', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('file', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    plugins.set('fs', fs)
    // Test
    let before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await remove({ gitdir, filepath: 'LICENSE.md' })
    let after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 1).toBe(true)
  })
  it('dir', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    plugins.set('fs', fs)
    // Test
    let before = await listFiles({ gitdir })
    expect(before).toMatchSnapshot()
    await remove({ gitdir, filepath: 'src/models' })
    let after = await listFiles({ gitdir })
    expect(after).toMatchSnapshot()
    expect(before.length === after.length + 5).toBe(true)
  })
})
