/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-push.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const EventEmitter = require('events')

const setTestTimeout = require('./__helpers__/set-test-timeout')
setTestTimeout(60000)

const { plugins, push } = require('isomorphic-git')

describe('push', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  // For now we are only running this in the browser, because the karma middleware solution only
  // works when running in Karma, and these tests also need to pass Jest and node-jasmine.
  // At some point, we need to wrap git-http-server so it can be launched pre-test and killed post-test
  // when running in jest/jasmine.
  it('push', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    let output = []
    plugins.set(
      'emitter',
      new EventEmitter().on('push.message', output.push.bind(output))
    )
    // Test
    let res = await push({
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
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    // Test
    let res = await push({
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
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    // Test
    let res = await push({
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/heads/foobar')
  })
  it('push with lightweight tag', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    // Test
    let res = await push({
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
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    // Test
    let res = await push({
      gitdir,
      remote: 'karma',
      ref: 'annotated-tag'
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBeTruthy()
    expect(res.ok[0]).toBe('unpack')
    expect(res.ok[1]).toBe('refs/tags/annotated-tag')
  })

  it('push with Basic Auth', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
    // Test
    let res = await push({
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
  it('throws an Error if no credentials supplied', async () => {
    // Setup
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
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
    let { fs, gitdir } = await makeFixture('test-push')
    plugins.set('fs', fs)
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
  ;(process.env.TEST_PUSH_GITHUB_TOKEN ? it : xit)(
    'push to Github using token',
    async () => {
      // Setup
      let { fs, gitdir } = await makeFixture('test-push')
      plugins.set('fs', fs)
      // Test
      let res = await push({
        gitdir,
        corsProxy: process.browser ? 'http://localhost:9999' : undefined,
        token: process.env.TEST_PUSH_GITHUB_TOKEN,
        remote: 'origin',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    }
  )
})
