/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-listFiles.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { listFiles } = require('isomorphic-git')

describe('listFiles', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('index', async () => {
    // Setup
    const { core, gitdir } = await makeFixture('test-listFiles')
    // Test
    const files = await listFiles({ core, gitdir })
    expect(files).toMatchSnapshot()
  })
  it('ref', async () => {
    // Setup
    const { core, gitdir } = await makeFixture('test-checkout')
    // Test
    const files = await listFiles({ core, gitdir, ref: 'test-branch' })
    expect(files).toMatchSnapshot()
  })
})
