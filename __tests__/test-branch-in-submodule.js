/* eslint-env node, browser, jasmine */
const path = require('path')

const {
  Errors,
  branch,
  init,
  currentBranch,
  listFiles,
} = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('branch', () => {
  ;(process.browser ? xit : it)('branch', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch'
    )
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch' })
    const files = await fs.readdir(
      path.resolve(gitdirsmfullpath, 'refs', 'heads')
    )
    expect(files).toEqual(['master', 'test-branch'])
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
  })
  ;(process.browser ? xit : it)('branch with start point', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch-start-point'
    )
    // Test
    let files = await fs.readdir(
      path.resolve(gitdirsmfullpath, 'refs', 'heads')
    )
    expect(files).toEqual(['main', 'start-point'])
    await branch({ fs, dir, gitdir, ref: 'test-branch', object: 'start-point' })
    files = await fs.readdir(path.resolve(gitdirsmfullpath, 'refs', 'heads'))
    expect(files).toEqual(['main', 'start-point', 'test-branch'])
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('main')
    expect(
      await fs.read(
        path.resolve(gitdir, 'refs', 'heads', 'test-branch'),
        'utf8'
      )
    ).toEqual(
      await fs.read(
        path.resolve(gitdir, 'refs', 'heads', 'start-point'),
        'utf8'
      )
    )
    expect(await listFiles({ fs, dir, gitdir, ref: 'HEAD' })).toEqual([
      'new-file.txt',
    ])
    expect(await listFiles({ fs, dir, gitdir, ref: 'test-branch' })).toEqual([])
  })
  ;(process.browser ? xit : it)('branch force', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch'
    )
    let error = null
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch' })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
    expect(
      await fs.exists(path.resolve(gitdirsmfullpath, 'refs/heads/test-branch'))
    ).toBeTruthy()
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })
  ;(process.browser ? xit : it)('branch with start point force', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch-start-point'
    )
    let error = null
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch', object: 'start-point' })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('main')
    expect(
      await fs.exists(path.resolve(gitdirsmfullpath, 'refs/heads/test-branch'))
    ).toBeTruthy()
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(await listFiles({ fs, dir, gitdir, ref: 'test-branch' })).toEqual([
      'new-file.txt',
    ])
  })
  ;(process.browser ? xit : it)('branch --checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-branch')
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch', checkout: true })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('test-branch')
  })
  ;(process.browser ? xit : it)('invalid branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-branch')
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'inv@{id..branch.lock' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidRefNameError).toBe(true)
  })
  ;(process.browser ? xit : it)('missing ref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixtureAsSubmodule('test-branch')
    let error = null
    // Test
    try {
      // @ts-ignore
      await branch({ fs, dir, gitdir })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })
  ;(process.browser ? xit : it)('empty repo', async () => {
    // Setup
    const { dir, fs, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch-empty-repo'
    )
    await init({ fs, dir, gitdir })
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch', checkout: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    const file = await fs.read(path.resolve(gitdirsmfullpath, 'HEAD'), 'utf8')
    expect(file).toBe(`ref: refs/heads/test-branch\n`)
  })
  ;(process.browser ? xit : it)(
    'create branch with same name as a remote',
    async () => {
      // Setup
      const {
        fs,
        dir,
        gitdir,
        gitdirsmfullpath,
      } = await makeFixtureAsSubmodule('test-branch')
      let error = null
      // Test
      try {
        await branch({ fs, dir, gitdir, ref: 'origin' })
      } catch (err) {
        error = err
      }
      expect(error).toBeNull()
      expect(
        await fs.exists(path.resolve(gitdirsmfullpath, 'refs/heads/origin'))
      ).toBeTruthy()
    }
  )
  ;(process.browser ? xit : it)('create branch named "HEAD"', async () => {
    // Setup
    const { fs, dir, gitdir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-branch'
    )
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'HEAD' })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(
      await fs.exists(path.resolve(gitdirsmfullpath, 'refs/heads/HEAD'))
    ).toBeTruthy()
  })
})
