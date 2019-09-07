/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-commit.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { plugins, commit, sign, verify, log } = require('isomorphic-git')

describe('commit', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })

  it('commit', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'Initial commit'
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // updates branch pointer
    const { oid: currentOid, parent } = (await log({ gitdir, depth: 1 }))[0]
    expect(parent).toEqual([originalOid])
    expect(currentOid).not.toEqual(originalOid)
    expect(currentOid).toEqual(sha)
  })

  it('without updating branch', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'Initial commit',
      noUpdateBranch: true
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ gitdir, depth: 1 }))[0]
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
    const { oid: originalOid } = (await log({ gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'Initial commit',
      dryRun: true
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ gitdir, depth: 1 }))[0]
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
    const { gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ gitdir, depth: 1 }))[0]
    // Test
    const sha = await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'Initial commit',
      ref: 'refs/heads/master-copy'
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update master branch pointer
    const { oid: currentOid } = (await log({ gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
    // but DOES update master-copy
    const { oid: copyOid } = (await log({
      gitdir,
      depth: 1,
      ref: 'master-copy'
    }))[0]
    expect(sha).toEqual(copyOid)
  })

  it('custom parents and tree', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-commit')
    const { oid: originalOid } = (await log({ gitdir, depth: 1 }))[0]
    // Test
    const parent = [
      '1111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333'
    ]
    const tree = '4444444444444444444444444444444444444444'
    const sha = await commit({
      gitdir,
      parent,
      tree,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: 'Initial commit'
    })
    expect(sha).toBe('43fbc94f2c1db655a833e08c72d005954ff32f32')
    // does NOT update master branch pointer
    const { parent: parents, tree: _tree } = (await log({
      gitdir,
      depth: 1
    }))[0]
    expect(parents).not.toEqual([originalOid])
    expect(parents).toEqual(parent)
    expect(_tree).toEqual(tree)
  })

  it('throw error if missing author', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-commit')
    // Test
    let error = null
    try {
      await commit({
        gitdir,
        author: {
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: 0
        },
        message: 'Initial commit'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
    // reset for test 2
    error = null
    try {
      await commit({
        gitdir,
        author: {
          name: 'Mr. Test',
          timestamp: 1262356920,
          timezoneOffset: 0
        },
        message: 'Initial commit'
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.toJSON()).toMatchSnapshot()
  })

  it('pgp plugin signing', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    const { gitdir } = await makeFixture('test-commit')
    plugins.set('pgp', pgp)
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await commit({
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425,
        timezoneOffset: 0
      },
      signingKey: privateKey
    })
    const keys = await verify({
      gitdir,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('pgp plugin signing - backwards compatiblity', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    const { gitdir } = await makeFixture('test-commit')
    plugins.set('pgp', pgp)
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await commit({
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425,
        timezoneOffset: 0
      }
    })
    await sign({
      gitdir,
      privateKeys: privateKey
    })
    const keys = await verify({
      gitdir,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('GPG signing (deprecated API)', async () => {
    // Setup
    const openpgp = require('openpgp/dist/openpgp.min.js')
    const { gitdir } = await makeFixture('test-commit')
    // Test
    const { privateKey, publicKey } = require('./__fixtures__/pgp-keys.js')
    await commit({
      gitdir,
      message: 'Initial commit',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1504842425,
        timezoneOffset: 0
      }
    })
    await sign({
      gitdir,
      // @ts-ignore
      openpgp,
      privateKeys: privateKey
    })
    const keys = await verify({
      gitdir,
      // @ts-ignore
      openpgp,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('with timezone', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-commit')
    let commits
    // Test
    await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0
      },
      message: '-0 offset'
    })
    commits = await log({ gitdir, depth: 1 })
    expect(Object.is(commits[0].author.timezoneOffset, -0)).toBeTruthy()

    await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 0
      },
      message: '+0 offset'
    })
    commits = await log({ gitdir, depth: 1 })
    expect(Object.is(commits[0].author.timezoneOffset, 0)).toBeTruthy()

    await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: 240
      },
      message: '+240 offset'
    })
    commits = await log({ gitdir, depth: 1 })
    expect(Object.is(commits[0].author.timezoneOffset, 240)).toBeTruthy()

    await commit({
      gitdir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -240
      },
      message: '-240 offset'
    })
    commits = await log({ gitdir, depth: 1 })
    expect(Object.is(commits[0].author.timezoneOffset, -240)).toBeTruthy()
  })
})
