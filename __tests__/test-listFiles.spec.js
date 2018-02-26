/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-listFiles.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { listFiles } = require('isomorphic-git')

describe('listFiles', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('listFiles', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listFiles')
    // Test
    const files = await listFiles({ fs, gitdir })
    expect(files).toMatchSnapshot2()
  })
})
