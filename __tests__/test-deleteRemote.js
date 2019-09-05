/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-deleteRemote.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { deleteRemote, listRemotes } = require('isomorphic-git')

describe('deleteRemote', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('deleteRemote', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteRemote')
    const remote = 'foo'
    // Test
    await deleteRemote({ dir, gitdir, remote })
    const a = await listRemotes({ dir, gitdir })
    expect(a).toEqual([{ remote: 'bar', url: 'git@github.com:bar/bar.git' }])
  })
  it('missing argument', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-addRemote')
    // Test
    let error = null
    try {
      await deleteRemote({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
})
