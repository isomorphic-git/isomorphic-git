/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-fastCheckout.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const {
  E,
  fastCheckout,
  listFiles,
  add,
  commit,
  branch
} = require('isomorphic-git')

describe('fastCheckout', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({ dir, gitdir, ref: 'test-branch' })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    const index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('ref: refs/heads/test-branch\n')
  })

  it('checkout by tag', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'v1.0.0'
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    const index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout by SHA', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    const index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout unfetched branch', async () => {
    // Setup
    const { dir, gitdir } = await makeFixture('test-checkout')
    let error = null
    try {
      await fastCheckout({ dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
    expect(error.caller).toEqual('git.checkout')
  })

  it('checkout file permissions', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await branch({ dir, gitdir, ref: 'other', checkout: true })
    await fastCheckout({ dir, gitdir, ref: 'test-branch' })
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
    await fastCheckout({ dir, gitdir, ref: 'other' })
    await fastCheckout({ dir, gitdir, ref: 'test-branch' })
    const actualRegularFileMode = (await fs.lstat(dir + '/regular-file.txt'))
      .mode
    const actualExecutableFileMode = (await fs.lstat(
      dir + '/executable-file.sh'
    )).mode
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })

  it('checkout changing file permissions', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')

    await fs.write(dir + '/regular-file.txt', 'regular file', {
      mode: 0o666
    })
    await fs.write(dir + '/executable-file.sh', 'executable file', {
      mode: 0o777
    })
    const { mode: expectedRegularFileMode } = await fs.lstat(
      dir + '/regular-file.txt'
    )
    const { mode: expectedExecutableFileMode } = await fs.lstat(
      dir + '/executable-file.sh'
    )

    // Test
    await fastCheckout({ dir, gitdir, ref: 'regular-file' })
    const { mode: actualRegularFileMode } = await fs.lstat(dir + '/hello.sh')
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)

    await fastCheckout({ dir, gitdir, ref: 'executable-file' })
    const { mode: actualExecutableFileMode } = await fs.lstat(dir + '/hello.sh')
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })

  it('checkout directories using filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/models', 'test']
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    const index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout files using filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/models/GitBlob.js', 'src/utils/write.js']
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchSnapshot()
    const index = await listFiles({ dir, gitdir })
    expect(index).toMatchSnapshot()
  })

  it('checkout detects conflicts', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await fastCheckout({
        dir,
        gitdir,
        ref: 'test-branch'
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(E.CheckoutConflictError)
    expect(error.data.filepaths).toEqual(['README.md'])
  })

  it('checkout files ignoring conflicts dry run', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await fastCheckout({
        dir,
        gitdir,
        ref: 'test-branch',
        force: true,
        dryRun: true
      })
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
    expect(await fs.read(`${dir}/README.md`, 'utf8')).toBe('Hello world')
  })

  it('checkout files ignoring conflicts', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await fastCheckout({
        dir,
        gitdir,
        ref: 'test-branch',
        force: true
      })
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
    expect(await fs.read(`${dir}/README.md`, 'utf8')).not.toBe('Hello world')
  })

  it('restore files to HEAD state by not providing a ref', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'test-branch'
    })
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await fastCheckout({
        dir,
        gitdir,
        force: true
      })
    } catch (e) {
      error = e
    }
    expect(error).toBeNull()
    expect(await fs.read(`${dir}/README.md`, 'utf8')).not.toBe('Hello world')
  })

  it('checkout files should not delete other files', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fastCheckout({
      dir,
      gitdir,
      ref: 'test-branch'
    })
    await fastCheckout({
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/utils', 'test']
    })
    const files = await fs.readdir(dir)
    expect(files).toContain('README.md')
  })
})
