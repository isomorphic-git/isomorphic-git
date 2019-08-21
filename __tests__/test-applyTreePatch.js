/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// const snapshots = require('./__snapshots__/test-applyTreePatch.js.snap')
// const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { log, merge } = require('isomorphic-git')
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
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'add-files-merge-remove-files'
    }))[0]
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
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    const oid = await applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'remove-files' and 'add-files'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'remove-files-merge-add-files'
    }))[0]
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
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    const oid = await applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    // Test
    const diff1 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'delete-first-half'
    })
    const diff2 = await diffTree({
      gitdir,
      before: 'mainline',
      after: 'delete-second-half'
    })
    const { treePatch, hasConflicts } = await mergeTreePatches({ treePatches: [diff1, diff2] })
    expect(hasConflicts).toBe(false)
    const oid = await applyTreePatch({
      fs,
      gitdir,
      base: 'mainline',
      treePatch
    })
    expect(oid).toBe(commit.tree)
  })

  it("merge 'delete-first-half' and 'delete-second-half' (dryRun)", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      dryRun: true
    })
    expect(report.tree).toBe(commit.tree)
  })

  it("merge 'delete-first-half' and 'delete-second-half'", async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-diff')
    const commit = (await log({
      gitdir,
      depth: 1,
      ref: 'delete-first-half-merge-delete-second-half'
    }))[0]
    // Test
    const report = await merge({
      fs,
      gitdir,
      ours: 'delete-first-half',
      theirs: 'delete-second-half',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
    })
    const mergeCommit = (await log({ gitdir, ref: 'delete-first-half', depth: 1 }))[0]
    expect(report.tree).toBe(commit.tree)
    expect(mergeCommit.tree).toEqual(commit.tree)
    expect(mergeCommit.message).toEqual(commit.message)
    expect(mergeCommit.parent).toEqual(commit.parent)
  })
})
