/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-listTags.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { listTags } = require('isomorphic-git')

describe('listTags', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listTags', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listTags')
    // Test
    let refs = await listTags({
      fs,
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
