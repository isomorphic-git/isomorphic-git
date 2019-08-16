/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-diffTree.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { diffTree } = require('isomorphic-git')

describe('diffTree', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('diff two empty commits', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'master', after: 'master' })
    expect(diff).toMatchSnapshot()
  })

  it('diff commit against itself', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'mainline', after: 'mainline' })
    expect(diff).toMatchSnapshot()
  })

  it('diff commit against empty commit', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'master', after: 'mainline' })
    expect(diff).toMatchSnapshot()
  })

  it('diff empty commit against commit', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'mainline', after: 'master' })
    expect(diff).toMatchSnapshot()
  })

  it('diff a-file against a-folder', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'a-folder', after: 'a-file' })
    expect(diff).toMatchSnapshot()
  })

  it('diff a-folder against a-file', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-diff')
    // Test
    let diff = await diffTree({ gitdir, before: 'a-file', after: 'a-folder' })
    expect(diff).toMatchSnapshot()
  })
})
