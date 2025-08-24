/* eslint-env node, browser, jasmine */
const path = require('path')

const {
  Errors,
  readCommit,
  commit,
  log,
  resolveRef,
  init,
  add,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('commit', () => {
  it('prevent commit if index has unmerged paths', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-GitIndex-unmerged')
    // Test
    let error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
        message: 'Initial commit',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.UnmergedPathsError.code)
  })
  it('commit', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    const sha = await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // updates branch pointer
    const { oid: currentOid, commit: currentCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]
    expect(currentCommit.parent).toEqual([originalOid])
    expect(currentCommit.author).toEqual(author)
    expect(currentCommit.committer).toEqual(author)
    expect(currentCommit.message).toEqual('Initial commit\n')
    expect(currentOid).not.toEqual(originalOid)
    expect(currentOid).toEqual(sha)
  })

  it('Initial commit', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir })
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({ fs, dir, filepath: 'hello.md' })

    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    await commit({
      fs,
      dir,
      author,
      message: 'Initial commit',
    })

    const commits = await log({ fs, dir })
    expect(commits.length).toBe(1)
    expect(commits[0].commit.parent).toEqual([])
    expect(await resolveRef({ fs, dir, ref: 'HEAD' })).toEqual(commits[0].oid)
  })

  it('Cannot commit without message', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    let error = null

    try {
      await commit({
        fs,
        gitdir,
        author,
      })
    } catch (err) {
      error = err
    }

    expect(error).not.toBeNull()
    expect(error instanceof Errors.MissingParameterError).toBe(true)
  })

  it('without updating branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      noUpdateBranch: true,
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // but DID create commit object
    expect(
      await fs.exists(
        `${gitdir}/objects/7a/51c0b1181d738198ff21c4679d3aa32eb52fe0`
      )
    ).toBe(true)
  })

  it('dry run', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      dryRun: true,
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // and did NOT create commit object
    expect(
      await fs.exists(
        `${gitdir}/objects/7a/51c0b1181d738198ff21c4679d3aa32eb52fe0`
      )
    ).toBe(false)
  })

  it('custom ref', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
      ref: 'refs/heads/master-copy',
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update master branch pointer
    const { oid: currentOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // but DOES update master-copy
    const { oid: copyOid } = (
      await log({
        fs,
        gitdir,
        depth: 1,
        ref: 'master-copy',
      })
    )[0]
    expect(sha).toEqual(copyOid)
  })

  it('custom parents and tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ fs, gitdir, depth: 1 }))[0]
    // Test
    const parent = [
      '1111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333',
    ]
    const tree = '4444444444444444444444444444444444444444'
    const sha = await commit({
      fs,
      gitdir,
      parent,
      tree,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: 'Initial commit',
    })
    expect(sha).toBe('43fbc94f2c1db655a833e08c72d005954ff32f32')
    // does NOT update master branch pointer
    const { parent: parents, tree: _tree } = (
      await log({
        fs,
        gitdir,
        depth: 1,
      })
    )[0].commit
    expect(parents).not.toEqual([originalOid])
    expect(parents).toEqual(parent)
    expect(_tree).toEqual(tree)
  })

  it('throw error if missing author', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    // Test
    let error = null
    try {
      await commit({
        fs,
        gitdir,
        author: {
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: 0,
        },
        message: 'Initial commit',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MissingNameError.code)
  })

  it('create signed commit', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    const { fs, gitdir } = await makeFixture('test-commit')
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    const oid = await commit({
      fs,
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425,
        timezoneOffset: 0,
      },
      signingKey: privateKey,
      onSign: pgp.sign,
    })
    const { commit: commitObject, payload } = await readCommit({
      fs,
      gitdir,
      oid,
    })
    const { valid, invalid } = await pgp.verify({
      payload,
      publicKey,
      signature: commitObject.gpgsig,
    })
    expect(invalid).toEqual([])
    expect(valid).toEqual(['f2f0ced8a52613c4'])
  })

  it('with timezone', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    let commits
    // Test
    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
      message: '-0 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, -0)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 0,
      },
      message: '+0 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, 0)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 240,
      },
      message: '+240 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(Object.is(commits[0].commit.author.timezoneOffset, 240)).toBeTruthy()

    await commit({
      fs,
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -240,
      },
      message: '-240 offset',
    })
    commits = await log({ fs, gitdir, depth: 1 })
    expect(
      Object.is(commits[0].commit.author.timezoneOffset, -240)
    ).toBeTruthy()
  })

  it('commit amend (new message)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })

    // Test
    const { oid: originalOid, commit: originalCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]
    await commit({
      fs,
      gitdir,
      message: 'Amended commit',
      amend: true,
    })
    const { oid: amendedOid, commit: amendedCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    expect(amendedOid).not.toEqual(originalOid)
    expect(amendedCommit.author).toEqual(originalCommit.author)
    expect(amendedCommit.committer).toEqual(originalCommit.committer)
    expect(amendedCommit.message).toEqual('Amended commit\n')
    expect(amendedCommit.parent).toEqual(originalCommit.parent)
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toEqual(amendedOid)
  })

  it('commit amend (change author, keep message)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author,
      message: 'Initial commit',
    })

    // Test
    const { oid: originalOid, commit: originalCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    const newAuthor = {
      name: 'Mr. Test 2',
      email: 'mrtest2@example.com',
      timestamp: 1262356921,
      timezoneOffset: -0,
    }
    await commit({
      fs,
      gitdir,
      author: newAuthor,
      amend: true,
    })
    const { oid: amendedOid, commit: amendedCommit } = (
      await log({ fs, gitdir, depth: 1 })
    )[0]

    expect(amendedOid).not.toEqual(originalOid)
    expect(amendedCommit.author).toEqual(newAuthor)
    expect(amendedCommit.committer).toEqual(newAuthor)
    expect(amendedCommit.message).toEqual(originalCommit.message)
    expect(amendedCommit.parent).toEqual(originalCommit.parent)
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toEqual(amendedOid)
  })

  it('Cannot amend without an initial commit', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-init')
    await init({ fs, dir })
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({ fs, dir, filepath: 'hello.md' })

    // Test
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }

    let error = null
    try {
      await commit({
        fs,
        dir,
        author,
        message: 'Initial commit',
        amend: true,
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NoCommitError).toBe(true)
  })
})
