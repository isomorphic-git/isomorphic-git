/* eslint-env node, browser, jasmine */
const {
  E,
  checkout,
  listFiles,
  add,
  commit,
  branch,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('checkout', () => {
  it('checkout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src",
        "test",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitTree.js",
        "src/utils/combinePayloadAndSignature.js",
        "src/utils/commitSha.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/unwrapObject.js",
        "src/utils/wrapCommit.js",
        "src/utils/write.js",
        "test/resolveRef.js",
        "test/smoke.js",
        "test/snapshots/resolveRef.js.md",
        "test/snapshots/resolveRef.js.snap",
      ]
    `)
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('ref: refs/heads/test-branch\n')
  })

  it('checkout by tag', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'v1.0.0',
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src",
        "test",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitTree.js",
        "src/utils/combinePayloadAndSignature.js",
        "src/utils/commitSha.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/unwrapObject.js",
        "src/utils/wrapCommit.js",
        "src/utils/write.js",
        "test/resolveRef.js",
        "test/smoke.js",
        "test/snapshots/resolveRef.js.md",
        "test/snapshots/resolveRef.js.snap",
      ]
    `)
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout by SHA', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src",
        "test",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        ".babelrc",
        ".editorconfig",
        ".flowconfig",
        ".gitignore",
        "LICENSE.md",
        "README.md",
        "package.json",
        "shrinkwrap.yaml",
        "src/commands/checkout.js",
        "src/commands/config.js",
        "src/commands/fetch.js",
        "src/commands/init.js",
        "src/index.js",
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitTree.js",
        "src/utils/combinePayloadAndSignature.js",
        "src/utils/commitSha.js",
        "src/utils/exists.js",
        "src/utils/mkdirs.js",
        "src/utils/read.js",
        "src/utils/resolveRef.js",
        "src/utils/unwrapObject.js",
        "src/utils/wrapCommit.js",
        "src/utils/write.js",
        "test/resolveRef.js",
        "test/smoke.js",
        "test/snapshots/resolveRef.js.md",
        "test/snapshots/resolveRef.js.snap",
      ]
    `)
    const sha = await fs.read(gitdir + '/HEAD', 'utf8')
    expect(sha).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e\n')
  })

  it('checkout unfetched branch', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    let error = null
    try {
      await checkout({ fs, dir, gitdir, ref: 'missing-branch' })
      throw new Error('Checkout should have failed.')
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchInlineSnapshot(`
      Object {
        "caller": "git.checkout",
        "code": "CommitNotFetchedError",
        "data": Object {
          "oid": "033417ae18b174f078f2f44232cb7a374f4c60ce",
          "ref": "missing-branch",
        },
        "message": "Failed to checkout \\"missing-branch\\" because commit 033417ae18b174f078f2f44232cb7a374f4c60ce is not available locally. Do a git fetch to make the branch available locally.",
      }
    `)
    expect(error.caller).toEqual('git.checkout')
  })

  it('checkout file permissions', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await branch({ fs, dir, gitdir, ref: 'other', checkout: true })
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    await fs.write(dir + '/regular-file.txt', 'regular file', {
      mode: 0o666,
    })
    await fs.write(dir + '/executable-file.sh', 'executable file', {
      mode: 0o777,
    })
    const expectedRegularFileMode = (await fs.lstat(dir + '/regular-file.txt'))
      .mode
    const expectedExecutableFileMode = (
      await fs.lstat(dir + '/executable-file.sh')
    ).mode
    await add({ fs, dir, gitdir, filepath: 'regular-file.txt' })
    await add({ fs, dir, gitdir, filepath: 'executable-file.sh' })
    await commit({
      fs,
      dir,
      gitdir,
      author: { name: 'Git', email: 'git@example.org' },
      message: 'add files',
    })
    await checkout({ fs, dir, gitdir, ref: 'other' })
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    const actualRegularFileMode = (await fs.lstat(dir + '/regular-file.txt'))
      .mode
    const actualExecutableFileMode = (
      await fs.lstat(dir + '/executable-file.sh')
    ).mode
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })

  it('checkout changing file permissions', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')

    await fs.write(dir + '/regular-file.txt', 'regular file', {
      mode: 0o666,
    })
    await fs.write(dir + '/executable-file.sh', 'executable file', {
      mode: 0o777,
    })
    const { mode: expectedRegularFileMode } = await fs.lstat(
      dir + '/regular-file.txt'
    )
    const { mode: expectedExecutableFileMode } = await fs.lstat(
      dir + '/executable-file.sh'
    )

    // Test
    await checkout({ fs, dir, gitdir, ref: 'regular-file' })
    const { mode: actualRegularFileMode } = await fs.lstat(dir + '/hello.sh')
    expect(actualRegularFileMode).toEqual(expectedRegularFileMode)

    await checkout({ fs, dir, gitdir, ref: 'executable-file' })
    const { mode: actualExecutableFileMode } = await fs.lstat(dir + '/hello.sh')
    expect(actualExecutableFileMode).toEqual(expectedExecutableFileMode)
  })

  it('checkout directories using filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/models', 'test'],
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        "src",
        "test",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        "src/models/GitBlob.js",
        "src/models/GitCommit.js",
        "src/models/GitConfig.js",
        "src/models/GitTree.js",
        "test/resolveRef.js",
        "test/smoke.js",
        "test/snapshots/resolveRef.js.md",
        "test/snapshots/resolveRef.js.snap",
      ]
    `)
  })

  it('checkout files using filepaths', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/models/GitBlob.js', 'src/utils/write.js'],
    })
    const files = await fs.readdir(dir)
    expect(files.sort()).toMatchInlineSnapshot(`
      Array [
        "src",
      ]
    `)
    const index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchInlineSnapshot(`
      Array [
        "src/models/GitBlob.js",
        "src/utils/write.js",
      ]
    `)
  })

  it('checkout detects conflicts', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-checkout')
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await checkout({
        fs,
        dir,
        gitdir,
        ref: 'test-branch',
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
      await checkout({
        fs,
        dir,
        gitdir,
        ref: 'test-branch',
        force: true,
        dryRun: true,
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
      await checkout({
        fs,
        dir,
        gitdir,
        ref: 'test-branch',
        force: true,
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
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'test-branch',
    })
    await fs.write(`${dir}/README.md`, 'Hello world', 'utf8')
    // Test
    let error = null
    try {
      await checkout({
        fs,
        dir,
        gitdir,
        force: true,
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
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'test-branch',
    })
    await checkout({
      fs,
      dir,
      gitdir,
      ref: 'test-branch',
      filepaths: ['src/utils', 'test'],
    })
    const files = await fs.readdir(dir)
    expect(files).toContain('README.md')
  })
})
