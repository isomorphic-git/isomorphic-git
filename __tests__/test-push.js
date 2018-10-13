/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-push.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const EventEmitter = require('events')

const { plugins, push } = require('isomorphic-git')

describe('push', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  // For now we are only running this in the browser, because the karma middleware solution only
  // works when running in Karma, and these tests also need to pass Jest and node-jasmine.
  // At some point, we need to wrap git-http-server so it can be launched pre-test and killed post-test
  // when running in jest/jasmine.
  ;(process.browser ? it : xit)(
    'push to karma-git-http-server-middleware',
    async () => {
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
    }
  )
  ;(process.browser ? it : xit)(
    'push to karma-git-http-server-middleware without ref',
    async () => {
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
    }
  )
  ;(process.browser ? it : xit)(
    'push to karma-git-http-server-middleware with ref !== remoteRef',
    async () => {
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
    }
  )
  ;(process.browser ? it : xit)(
    'push to karma-git-http-server-middleware with lightweight tag',
    async () => {
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
    }
  )
  ;(process.browser ? it : xit)(
    'push to karma-git-http-server-middleware with annotated tag',
    async () => {
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
    }
  )
})
