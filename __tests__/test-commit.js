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
    let { gitdir } = await makeFixture('test-commit')
    // Test
    let sha = await commit({
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
  })

  it('throw error if missing author', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-commit')
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
    let { gitdir } = await makeFixture('test-commit')
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
    let keys = await verify({
      gitdir,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('pgp plugin signing - backwards compatiblity', async () => {
    // Setup
    const { pgp } = require('@isomorphic-git/pgp-plugin')
    let { gitdir } = await makeFixture('test-commit')
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
    let keys = await verify({
      gitdir,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('GPG signing (deprecated API)', async () => {
    // Setup
    const openpgp = require('openpgp/dist/openpgp.min.js')
    let { gitdir } = await makeFixture('test-commit')
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
    let keys = await verify({
      gitdir,
      openpgp,
      ref: 'HEAD',
      publicKeys: publicKey
    })
    expect(keys[0]).toBe('f2f0ced8a52613c4')
  })

  it('with timezone', async () => {
    // Setup
    let { gitdir } = await makeFixture('test-commit')
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
