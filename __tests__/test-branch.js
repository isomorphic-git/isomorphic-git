/* eslint-env node, browser, jasmine */
const path = require('path')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-branch.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { branch, init, currentBranch } = require('isomorphic-git')

describe('branch', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    // Test
    await branch({ dir, gitdir, ref: 'test-branch' })
    const files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
    expect(await currentBranch({ dir, gitdir })).toEqual('master')
  })

  it('branch --checkout', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-branch')
    // Test
    await branch({ dir, gitdir, ref: 'test-branch', checkout: true })
    expect(await currentBranch({ dir, gitdir })).toEqual('test-branch')
  })

  it('invalid branch name', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      await branch({ dir, gitdir, ref: 'inv@{id..branch.lock' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('missing ref argument', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      // @ts-ignore
      await branch({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('empty repo', async () => {
    // Setup
    const { dir, fs, gitdir } = await makeFixture('test-branch-empty-repo')
    await init({ dir, gitdir })
    let error = null
    // Test
    try {
      await branch({ dir, gitdir, ref: 'test-branch', checkout: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    const file = await fs.read(path.resolve(gitdir, 'HEAD'), 'utf8')
    expect(file).toBe(`ref: refs/heads/test-branch\n`)
  })

  it('create branch with same name as a remote', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      await branch({ dir, gitdir, ref: 'origin' })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(
      await fs.exists(path.resolve(gitdir, 'refs/heads/origin'))
    ).toBeTruthy()
  })

  it('create branch named "HEAD"', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      await branch({ dir, gitdir, ref: 'HEAD' })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(
      await fs.exists(path.resolve(gitdir, 'refs/heads/HEAD'))
    ).toBeTruthy()
  })
})
