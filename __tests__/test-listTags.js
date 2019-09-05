/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-listTags.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { listTags } = require('isomorphic-git')

describe('listTags', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listTags', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-listTags')
    // Test
    const refs = await listTags({
      gitdir
    })
    expect(refs).toMatchSnapshot()
  })
})
