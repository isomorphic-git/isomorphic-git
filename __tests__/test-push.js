/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// @ts-ignore
const snapshots = require('./__snapshots__/test-push.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const EventEmitter = require('events')

const { plugins, config, push, listBranches } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('push', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('push', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    const output = []
    plugins.set(
      'emitter',
      new EventEmitter().on('push.message', output.push.bind(output))
    )
    // Test
    const res = await push({
      gitdir,
      emitterPrefix: 'push.',
      remote: 'karma',
      ref: 'refs/heads/master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
    expect(output).toMatchSnapshot()
  })
  it('push without ref', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      gitdir,
      remote: 'karma'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })
  it('push with ref !== remoteRef', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/foobar')
    expect(await listBranches({ gitdir, remote: 'karma' })).toContain('foobar')
  })
  it('push with lightweight tag', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      gitdir,
      remote: 'karma',
      ref: 'lightweight-tag'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/tags/lightweight-tag')
  })
  it('push with annotated tag', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    // Test
    const res = await push({
      gitdir,
      remote: 'karma',
      ref: 'annotated-tag'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/tags/annotated-tag')
  })
  it('push delete', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`
    })
    await push({
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar'
    })
    expect(await listBranches({ gitdir, remote: 'karma' })).toContain('foobar')
    // Test
    const res = await push({
      gitdir,
      remote: 'karma',
      remoteRef: 'foobar',
      delete: true
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/foobar')
    expect(await listBranches({ gitdir, remote: 'karma' })).not.toContain(
      'foobar'
    )
  })

  it('push with Basic Auth', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    const res = await push({
      gitdir,
      username: 'testuser',
      password: 'testpassword',
      remote: 'auth',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })
  it('push with Basic Auth credentials in the URL', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.url.url',
      value: `http://testuser:testpassword@${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    const res = await push({
      gitdir,
      remote: 'url',
      ref: 'master'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/master')
  })
  it('throws an Error if no credentials supplied', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let error = null
    try {
      await push({
        gitdir,
        remote: 'auth',
        ref: 'master'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })
  it('throws an Error if invalid credentials supplied', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let error = null
    try {
      await push({
        gitdir,
        username: 'test',
        password: 'test',
        remote: 'auth',
        ref: 'master'
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })
})
