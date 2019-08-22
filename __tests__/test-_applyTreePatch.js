/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { log } = require('isomorphic-git')
const {
  _applyTreePatch,
  _diffTree,
  _mergeTreePatches
} = require('isomorphic-git/internal-apis')

describe('_applyTreePatch', () => {
  it("merge 'add-files' and 'remove-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'add-files-merge-remove-files'
    }))[0]
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
      after: 'remove-files'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({
      treePatches: [diff1, diff2]
    })
    expect(hasConflicts).toBe(false)
    const oid = await _applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'remove-files-merge-add-files'
    }))[0]
    // Test
    const diff1 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'remove-files'
    })
    const diff2 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({
      treePatches: [diff1, diff2]
    })
    expect(hasConflicts).toBe(false)
    const oid = await _applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-_diffTree')
    const commit = (await log({
      fs,
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    // Test
    const diff1 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'delete-first-half'
    })
    const diff2 = await _diffTree({
      fs,
      gitdir,
      before: 'mainline',
      after: 'delete-second-half'
    })
    const { treePatch, hasConflicts } = await _mergeTreePatches({
      treePatches: [diff1, diff2]
    })
    expect(hasConflicts).toBe(false)
    const oid = await _applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })
})
