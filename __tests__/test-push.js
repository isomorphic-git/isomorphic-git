/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const snapshots = require('./__snapshots__/test-push.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const EventEmitter = require('events')

const { push } = require('isomorphic-git')

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
      let { fs, dir, gitdir } = await makeFixture('test-push')
      let output = []
      let emitter = new EventEmitter().on('message', output.push.bind(output))
      // Test
      let res = await push({
        fs,
        gitdir,
        emitter,
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
})
