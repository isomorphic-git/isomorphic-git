/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-checkout.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const { checkout, listFiles, add, commit, branch } = require('isomorphic-git')

describe('checkout', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('checkout', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ dir, gitdir, ref: 'test-branch' })
    let files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    let sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('ref: refs/heads/test-branch\n')
  })

  it('checkout by tag', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      dir,
      gitdir,
      ref: 'v1.0.0'
    })
    let files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    let sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout by SHA', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      dir,
      gitdir,
      ref: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    let files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    let sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout unfetched branch', async () => {
    // Setup
    let { dir, gitdir } = await makeFixture('test-checkout')
    let error = null
    try {
      await checkout({ dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
    expect(error.caller).toEqual('git.checkout')
  })

  it('checkout file permissions', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await branch({ dir, gitdir, ref: 'other', checkout: true })
    await checkout({ dir, gitdir, ref: 'test-branch' })
    await fs.write(dir + '/regular-file.txt', 'regular file', {
      mode: 0o666
    })
    await fs.write(dir + '/executable-file.sh', 'executable file', {
      mode: 0o777
    })
    const expectedRegularFileMode = (await fs.lstat(dir + '/regular-file.txt'))
      .mode
    const expectedExecutableFileMode = (await fs.lstat(
      dir + '/executable-file.sh'
    )).mode
    await add({ dir, gitdir, filepath: 'regular-file.txt' })
    await add({ dir, gitdir, filepath: 'executable-file.sh' })
    await commit({
      dir,
      gitdir,
      author: { name: 'Git', email: 'git@example.org' },
      message: 'add files'
    })
    await checkout({ dir, gitdir, ref: 'other' })
    await checkout({ dir, gitdir, ref: 'test-branch' })
    const actualRegularFileMode = (await fs.lstat(dir + '/regular-file.txt'))
      .mode
    const actualExecutableFileMode = (await fs.lstat(
      dir + '/executable-file.sh'
    )).mode
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })

  it('checkout using pattern', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await branch({ dir, gitdir, ref: 'other', checkout: true })
    await checkout({ dir, gitdir, ref: 'test-branch' })
    await fs.write(dir + '/regular-file.txt', 'regular file')
    await fs.write(dir + '/executable-file.sh', 'executable file')
    await add({ dir, gitdir, filepath: 'regular-file.txt' })
    await add({ dir, gitdir, filepath: 'executable-file.sh' })
    await commit({
      dir,
      gitdir,
      author: { name: 'Git', email: 'git@example.org' },
      message: 'add files'
    })
    await checkout({ dir, gitdir, ref: 'other' })
    await checkout({ dir, gitdir, ref: 'test-branch', pattern: '*.txt' })
    let files = await fs.readdir(dir)
    expect(files).toContain('regular-file.txt')
    expect(files).not.toContain('executable-file.sh')
  })
})
