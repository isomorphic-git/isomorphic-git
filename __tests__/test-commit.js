/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
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
    const { oid: currentOid } = (await log({ gitdir, depth: 1 }))[0]
    expect(currentOid).not.toEqual(originalOid)
    expect(currentOid).toEqual(sha)
  })

  it('without updating branch', async () => {
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
      updateBranch: false
    })
    expect(sha).toBe('7a51c0b1181d738198ff21c4679d3aa32eb52fe0')
    // does NOT update branch pointer
    const { oid: currentOid } = (await log({ gitdir, depth: 1 }))[0]
    expect(currentOid).toEqual(originalOid)
    expect(currentOid).not.toEqual(sha)
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
    const { oid: copyOid } = (await log({ gitdir, depth: 1, ref: 'master-copy' }))[0]
    expect(sha).toEqual(copyOid)
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
      openpgp,
      privateKeys: privateKey
    })
    const keys = await verify({
      gitdir,
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
