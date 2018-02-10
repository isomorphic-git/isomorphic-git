/* global test describe expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { remove, listFiles } = require('isomorphic-git')


describe('remove', () => {
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
