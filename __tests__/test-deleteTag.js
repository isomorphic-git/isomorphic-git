/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-deleteTag.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, deleteTag, listTags } = require('isomorphic-git')

describe('deleteTag', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('deletes the latest tag to HEAD', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-deleteTag')
    plugins.set('fs', fs)
    // Test
    await deleteTag({
      gitdir,
      ref: 'latest'
    })
    let refs = await listTags({
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
