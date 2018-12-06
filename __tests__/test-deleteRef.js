/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-deleteRef.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, deleteRef, listTags } = require('isomorphic-git')

describe('deleteRef', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('deletes the latest tag ref to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-deleteRef')
    plugins.set('fs', fs)
    // Test
    await deleteRef({
      gitdir,
      ref: 'refs/tags/latest'
    })
    let refs = await listTags({
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
