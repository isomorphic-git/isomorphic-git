/* eslint-env node, browser, jasmine */
const path = require('path')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-deleteBranch.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { deleteBranch } = require('isomorphic-git')

describe('deleteBranch', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('delete branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-deleteBranch')
    // Test
    await deleteBranch({ dir, gitdir, ref: 'test' })
    const files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
  })

  it('invalid branch name', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteBranch')
    let error = null
    // Test
    try {
      await deleteBranch({ dir, gitdir, ref: 'inv@{id..branch.lock' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('branch not exist', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteBranch')
    let error = null
    // Test
    try {
      await deleteBranch({ dir, gitdir, ref: 'branch-not-exist' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('missing ref argument', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteBranch')
    let error = null
    // Test
    try {
      await deleteBranch({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('checked out branch', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-deleteBranch')
    let error = null
    // Test
    try {
      await deleteBranch({ dir, gitdir, ref: 'master' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
})
