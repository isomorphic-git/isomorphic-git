/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-_mergeTreePatches.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { _diffTree, _mergeTreePatches } = require('isomorphic-git/internal-apis')

describe('_mergeTreePatches', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('merge two empty TreePatches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    // Test
    const diff1 = await _diffTree({ fs, gitdir, before: 'master', after: 'master' })
    const diff2 = await _diffTree({ fs, gitdir, before: 'master', after: 'master' })
    const { treePatch, hasConflicts } = await _mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toEqual({ basename: '.', index: 0, ops: [] })
  })

  it('merge two conflicting TreePatches', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    // Test
    const diff1 = await _diffTree({ fs, gitdir, before: 'master', after: 'a-file' })
    const diff2 = await _diffTree({
      fs,
      gitdir,
      before: 'master',
      after: 'a-folder'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(true)
    expect(treePatch).toMatchSnapshot()
  })

  it('merge add-files and change-modes', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    // Test
    const diff1 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const diff2 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'change-modes'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toMatchSnapshot()
  })

  it('merge add-files and remove-files', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    // Test
    const diff1 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const diff2 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'remofe-files'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    expect(treePatch).toMatchSnapshot()
  })
})
