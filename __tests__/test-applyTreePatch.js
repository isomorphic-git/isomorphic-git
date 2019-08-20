/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// const snapshots = require('./__snapshots__/test-applyTreePatch.js.snap')
// const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { log } = require('isomorphic-git')
const {
  mergeTreePatches,
  applyTreePatch
} = require('isomorphic-git/internal-apis')
// @ts-ignore
const { diffTree } = require('isomorphic-git')

describe('applyTreePatch', () => {
  beforeAll(() => {
    // registerSnapshots(snapshots)
  })

  it("merge 'add-files' and 'remove-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const diff2 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'remove-files'
    })
    const treePatch = await mergeTreePatches({ treePatches: [diff1, diff2] })
    const oid = await applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'add-files-merge-remove-files'
    }))[0]
    expect(oid).toBe(commit.tree)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    // Test
    const diff1 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'remove-files'
    })
    const diff2 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'add-files'
    })
    const treePatch = await mergeTreePatches({ treePatches: [diff1, diff2] })
    const oid = await applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'remove-files-merge-add-files'
    }))[0]
    expect(oid).toBe(commit.tree)
  })
})
