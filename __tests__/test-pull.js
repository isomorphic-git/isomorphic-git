/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const path = require('path')

const { setConfig, pull, log, add, commit, Errors } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('pull', () => {
  it('pull', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-pull')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    let logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Initial commit\n',
    ])
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'refs/heads/master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Added c.txt\n',
      'Added b.txt\n',
      'Initial commit\n',
    ])
  })
  it('pull fast-forward only', async () => {
    // Setup
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    const { fs, gitdir, dir } = await makeFixture('test-pull-no-ff')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    await fs.write(path.join(dir, 'z.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'z.txt' })
    await commit({ fs, dir, gitdir, message: 'Added z.txt', author })
    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Added z.txt\n',
      'Initial commit\n',
    ])
    let err = null
    try {
      await pull({
        fs,
        http,
        gitdir,
        dir,
        remote: 'origin',
        ref: 'refs/heads/master',
        fastForwardOnly: true,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      err = e
    }
    expect(err.caller).toBe('git.pull')
    expect(err.code).toBe(Errors.FastForwardError.code)
  })
  it('pull no fast-forward', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-pull-no-ff')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    let logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Initial commit\n',
    ])
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'refs/heads/master',
      fastForward: false,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    const formattedLogs = logs.map(
      ({ commit }) => `${commit.message} (${commit.parent.join(' ')})`
    )
    expect(formattedLogs).toEqual([
      "Merge branch 'master' of http://localhost:8888/test-pull-server.git\n (5a8905a02e181fe1821068b8c0f48cb6633d5b81 97c024f73eaab2781bf3691597bc7c833cb0e22f)",
      'Added c.txt\n (c82587c97be8f9a10088590e06c9d0f767ed5c4a)',
      'Added b.txt\n (5a8905a02e181fe1821068b8c0f48cb6633d5b81)',
      'Initial commit\n ()',
    ])
  })
})
