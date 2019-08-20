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
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({ gitdir, before: 'master', after: 'master' })
    expect(diff).toMatchSnapshot()
  })

  it('diff commit against itself', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'mainline'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff commit against empty commit', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({ gitdir, before: 'master', after: 'mainline' })
    expect(diff).toMatchSnapshot()
  })

  it('diff empty commit against commit', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({ gitdir, before: 'mainline', after: 'master' })
    expect(diff).toMatchSnapshot()
  })

  it('diff add-files against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff remove-files against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'remove-files'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff a-file against a-folder', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({ gitdir, before: 'a-folder', after: 'a-file' })
    expect(diff).toMatchSnapshot()
  })

  it('diff a-folder against a-file', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({ gitdir, before: 'a-file', after: 'a-folder' })
    expect(diff).toMatchSnapshot()
  })

  it('diff nest-folder against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'nest-folder'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff mainline against nest-folder', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'nest-folder',
      after: 'mainline'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff folder-replaces-file against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'folder-replaces-file'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff rename-folder against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'rename-folder'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff change-modes against mainline', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'change-modes'
    })
    expect(diff).toMatchSnapshot()
  })

  it('diff mainline against change-modes', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff = await diffTree({
      gitdir,
      before: 'change-modes',
      after: 'mainline'
    })
    expect(diff).toMatchSnapshot()
  })
})
