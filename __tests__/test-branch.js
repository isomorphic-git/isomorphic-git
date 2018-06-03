/* eslint-env node, browser, jasmine */
const path = require('path')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-branch.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const pify = require('pify')

const { branch, init } = require('isomorphic-git')

describe('branch', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('branch', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(path.resolve(gitdir, 'refs', 'heads'))
    expect(files.sort()).toMatchSnapshot()
  })

  it('invalid branch name', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'inv@{id..branch.lock' })
    } catch (err) {
      error = err
    }
    expect(error.message).toEqual(
      `Failed to create branch 'inv@{id..branch.lock' because that name would not be a valid git reference. A valid alternative would be 'inv-id.branch'.`
    )
    expect(error.caller).toEqual('git.branch')
  })

  it('missing ref argument', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error.message).toEqual('Cannot create branch "undefined"')
    expect(error.caller).toEqual('git.branch')
  })

  it('empty repo', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-branch-empty-repo')
    await init({ fs, dir, gitdir })
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch' })
    } catch (err) {
      error = err
    }
    expect(error.message).toEqual(
      `Failed to create branch 'test-branch' because there are no commits in this project.`
    )
    expect(error.caller).toEqual('git.branch')
  })
})
