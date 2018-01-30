/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { assertSnapshot } = require('./__helpers__/assertSnapshot')
const snapshots = require('./__snapshots__/test-remove.js.snap')
const { remove, listFiles } = require('..')

describe('remove', () => {
  it('file', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    // Test
    let before = await listFiles({ fs, gitdir })
    assertSnapshot(before, snapshots, `remove file 1`)
    await remove({ fs, gitdir, filepath: 'LICENSE.md' })
    let after = await listFiles({ fs, gitdir })
    assertSnapshot(after, snapshots, `remove file 2`)
    expect(before.length === after.length + 1).toBe(true)
  })
  it('dir', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-remove')
    // Test
    let before = await listFiles({ fs, gitdir })
    assertSnapshot(before, snapshots, `remove dir 1`)
    await remove({ fs, gitdir, filepath: 'src/models' })
    let after = await listFiles({ fs, gitdir })
    assertSnapshot(after, snapshots, `remove dir 2`)
    expect(before.length === after.length + 5).toBe(true)
  })
})
