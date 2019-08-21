/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-mergeTreePatches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { mergeTreePatches } = require('isomorphic-git/internal-apis')
// @ts-ignore
const { diffTree } = require('isomorphic-git')

describe('mergeTreePatches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('merge two empty TreePatches', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'master', after: 'master' })
    const diff2 = await diffTree({ gitdir, before: 'master', after: 'master' })
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toEqual({ basename: '.', index: 0, ops: [] })
  })

  it('merge two conflicting TreePatches', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({ gitdir, before: 'master', after: 'a-file' })
    const diff2 = await diffTree({
      gitdir,
      before: 'master',
      after: 'a-folder'
    })
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(true)
    expect(treePatch).toMatchSnapshot()
  })

  it('merge add-files and change-modes', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const diff2 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'change-modes'
    })
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toMatchSnapshot()
  })

  it('merge add-files and remove-files', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const diff2 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'remofe-files'
    })
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toMatchSnapshot()
  })
})
