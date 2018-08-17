/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-listFiles.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, listFiles } = require('isomorphic-git')

describe('listFiles', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('index', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-listFiles')
    plugins.set('fs', fs)
    // Test
    const files = await listFiles({ gitdir })
    expect(files).toMatchSnapshot()
  })
  it('ref', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-checkout')
    plugins.set('fs', fs)
    // Test
    const files = await listFiles({ gitdir, ref: 'test-branch' })
    expect(files).toMatchSnapshot()
  })
})
