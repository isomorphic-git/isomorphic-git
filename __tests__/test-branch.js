/* eslint-env node, browser, jasmine */
const path = require('path')

const {
  Errors,
  branch,
  init,
  currentBranch,
  listFiles,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('branch', () => {
  it('branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch' })
    const files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
    expect(files).toEqual(['master', 'test-branch'])
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
  })

  it('branch with start point', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch-start-point')
    // Test
    let files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
    expect(files).toEqual(['main', 'start-point'])
    await branch({ fs, dir, gitdir, ref: 'test-branch', object: 'start-point' })
    files = await fs.readdir(path.resolve(gitdir, 'refs', 'heads'))
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

  it('branch force', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    let error = null
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch' })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('master')
    expect(
      await fs.exists(path.resolve(gitdir, 'refs/heads/test-branch'))
    ).toBeTruthy()
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch', force: true })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
  })

  it('branch with start point force', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch-start-point')
    let error = null
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch', object: 'start-point' })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('main')
    expect(
      await fs.exists(path.resolve(gitdir, 'refs/heads/test-branch'))
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

  it('branch --checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
    // Test
    await branch({ fs, dir, gitdir, ref: 'test-branch', checkout: true })
    expect(await currentBranch({ fs, dir, gitdir })).toEqual('test-branch')
  })

  it('invalid branch name', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
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

  it('missing ref argument', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-branch')
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

  it('empty repo', async () => {
    // Setup
    const { dir, fs, gitdir } = await makeFixture('test-branch-empty-repo')
    await init({ fs, dir, gitdir })
    let error = null
    // Test
    try {
      await branch({ fs, dir, gitdir, ref: 'test-branch', checkout: true })
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
      await branch({ fs, dir, gitdir, ref: 'origin' })
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
      await branch({ fs, dir, gitdir, ref: 'HEAD' })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(
      await fs.exists(path.resolve(gitdir, 'refs/heads/HEAD'))
    ).toBeTruthy()
  })
})
