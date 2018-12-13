/* eslint-env node, browser, jasmine */
const path = require('path')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-branch.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')

const { plugins, branch, init, currentBranch, resolveRef } = require('isomorphic-git')

describe('branch', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    // Test
    await branch({ dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
    expect(await currentBranch({ dir, gitdir })).toEqual('master')
  })

  it('branch exists', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    // Test
    let error = null
    try {
      await branch({ dir, gitdir, ref: 'existing-branch' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe('RefExistsError')
  })

  it('branch --force', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    let oidMaster = await resolveRef({ dir, gitdir, ref: 'master' })
    let oidExistingBranch = await resolveRef({ dir, gitdir, ref: 'existing-branch' })
    // Test
    await branch({ dir, gitdir, ref: 'existing-branch', force: true })
    let files = await pify(fs.readdir)(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
    expect(await currentBranch({ dir, gitdir })).toEqual('master')
    expect(oidMaster).not.toEqual(oidExistingBranch)
    expect(await resolveRef({ dir, gitdir, ref: 'existing-branch' })).toEqual(oidMaster)
  })

  it('branch --checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    // Test
    await branch({ dir, gitdir, ref: 'test-branch', checkout: true })
    expect(await currentBranch({ dir, gitdir })).toEqual('test-branch')
  })

  it('branch --checkout --force', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    let oidMaster = await resolveRef({ dir, gitdir, ref: 'master' })
    let oidExistingBranch = await resolveRef({ dir, gitdir, ref: 'existing-branch' })
    // Test
    await branch({ dir, gitdir, ref: 'existing-branch', checkout: true, force: true })
    let files = await pify(fs.readdir)(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
    expect(await currentBranch({ dir, gitdir })).toEqual('existing-branch')
    expect(oidMaster).not.toEqual(oidExistingBranch)
    expect(await resolveRef({ dir, gitdir, ref: 'existing-branch' })).toEqual(oidMaster)
  })

  it('invalid branch name', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
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
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    plugins.set('fs', fs)
    let error = null
    // Test
    try {
      await branch({ dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('empty repo', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch-empty-repo')
    plugins.set('fs', fs)
    await init({ dir, gitdir })
    let error = null
    // Test
    try {
      await branch({ dir, gitdir, ref: 'test-branch' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })
})
