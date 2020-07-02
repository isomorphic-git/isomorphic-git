/* eslint-env node, browser, jasmine */
const path = require('path')

const { Errors, renameBranch, currentBranch } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('branch', () => {
  it('rename branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    // Test
    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'test-branch',
      ref: 'other-branch',
    })
    const files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
    expect(files).toEqual(['master', 'other-branch'])
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
  })

  it('rename branch and checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    // Test
    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'test-branch',
      ref: 'other-branch',
      checkout: true,
    })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('other-branch')
  })

  it('invalid new branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    let error = null
    // Test
    try {
      await renameBranch({
        fs,
        dir,
        gitdir,
        oldref: 'test-branch',
        ref: 'inv@{id..branch.lock',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidRefNameError).toBe(true)
  })

  it('invalid old branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    let error = null
    // Test
    try {
      await renameBranch({
        fs,
        dir,
        gitdir,
        ref: 'other-branch',
        oldref: 'inv@{id..branch.lock',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidRefNameError).toBe(true)
  })

  it('missing ref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    let error = null
    // Test
    try {
      // @ts-ignore
      await renameBranch({ fs, dir, gitdir, oldref: 'test-branch' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })

  it('missing oldref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-renameBranch')
    let error = null
    // Test
    try {
      // @ts-ignore
      await renameBranch({ fs, dir, gitdir, ref: 'other-branch' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
})
