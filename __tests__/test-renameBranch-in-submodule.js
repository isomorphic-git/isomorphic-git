/* eslint-env node, browser, jasmine */
const path = require('path')

const { Errors, renameBranch, currentBranch } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('renameBranch', () => {
  ;(process.browser ? xit : it)('branch already exists', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
    let error = null
    // Test
    try {
      await renameBranch({
        fs,
        dir,
        gitdir,
        oldref: 'test-branch',
        ref: 'existing-branch',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.AlreadyExistsError).toBe(true)
  })
  ;(process.browser ? xit : it)('invalid new branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
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
  ;(process.browser ? xit : it)('invalid old branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
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
  ;(process.browser ? xit : it)('missing ref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
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
  ;(process.browser ? xit : it)('missing oldref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
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
  ;(process.browser ? xit : it)('rename branch', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
    // Test
    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'test-branch',
      ref: 'other-branch',
    })
    const files = await fs.readdir(
      path.resolve(gitdirsmfullpath, 'refs', 'heads')
    )
    expect(files.includes('test-branch')).toBe(false)
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
  })
  ;(process.browser ? xit : it)('rename branch and checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
    // Test
    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'test-branch-2',
      ref: 'other-branch-2',
      checkout: true,
    })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('other-branch-2')
  })
  ;(process.browser ? xit : it)('rename current branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule(
      'test-renameBranch'
    )
    // Test
    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'master',
      ref: 'other-branch',
    })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('other-branch')

    await renameBranch({
      fs,
      dir,
      gitdir,
      oldref: 'other-branch',
      ref: 'master',
    })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
  })
})
